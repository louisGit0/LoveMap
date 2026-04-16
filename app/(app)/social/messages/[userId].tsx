import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { Profile } from '@/types/app.types';

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ConversationScreen() {
  const { userId: otherUserId } = useLocalSearchParams<{ userId: string }>();
  const { user } = useAuth();

  const [otherProfile, setOtherProfile] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  const loadMessages = useCallback(async () => {
    if (!user || !otherUserId) return;

    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(
        `and(sender_id.eq.${user.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${user.id})`
      )
      .order('created_at', { ascending: true });

    if (data) setMessages(data as Message[]);
  }, [user, otherUserId]);

  // Marquer les messages reçus comme lus
  const markAsRead = useCallback(async () => {
    if (!user || !otherUserId) return;
    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('sender_id', otherUserId)
      .eq('recipient_id', user.id)
      .is('read_at', null);
  }, [user, otherUserId]);

  useEffect(() => {
    if (!otherUserId) return;

    // Charger le profil
    supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .eq('id', otherUserId)
      .single()
      .then(({ data }) => {
        if (data) setOtherProfile(data as Profile);
      });

    // Charger les messages
    loadMessages().then(() => {
      markAsRead();
      setLoading(false);
    });

    // Realtime — nouveaux messages
    if (!user) return;
    const channel = supabase
      .channel(`conv-${user.id}-${otherUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${user.id}`,
        },
        (payload) => {
          const msg = payload.new as Message;
          if (msg.sender_id !== otherUserId) return;
          setMessages((prev) => [...prev, msg]);
          markAsRead();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [otherUserId, loadMessages, markAsRead, user]);

  async function handleSend() {
    if (!inputText.trim() || !user || !otherUserId) return;
    setSending(true);
    const content = inputText.trim();
    setInputText('');

    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: user.id,
        recipient_id: otherUserId,
        content,
      })
      .select()
      .single();

    if (!error && data) {
      setMessages((prev) => [...prev, data as Message]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
    setSending(false);
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#e91e8c" size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Retour</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName} numberOfLines={1}>
            {otherProfile?.display_name ?? otherProfile?.username ?? '…'}
          </Text>
          {otherProfile?.username && (
            <Text style={styles.headerUsername}>@{otherProfile.username}</Text>
          )}
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isOwn = item.sender_id === user?.id;
          return (
            <View style={[styles.messageBubbleRow, isOwn && styles.messageBubbleRowOwn]}>
              <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
                <Text style={[styles.bubbleText, isOwn && styles.bubbleTextOwn]}>
                  {item.content}
                </Text>
                <Text style={[styles.bubbleTime, isOwn && styles.bubbleTimeOwn]}>
                  {formatTime(item.created_at)}
                </Text>
              </View>
            </View>
          );
        }}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        showsVerticalScrollIndicator={false}
      />

      {/* Zone de saisie */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={(v) => v.length <= 1000 && setInputText(v)}
          placeholder="Écrire un message..."
          placeholderTextColor="#555"
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || sending) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim() || sending}
          activeOpacity={0.8}
        >
          {sending
            ? <ActivityIndicator size="small" color="#ffffff" />
            : <Text style={styles.sendButtonText}>↑</Text>
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  centered: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 52,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
    gap: 12,
  },
  backButton: {
    backgroundColor: '#0f0f0f',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 14,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerUsername: {
    color: '#888888',
    fontSize: 12,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  messageBubbleRow: {
    flexDirection: 'row',
    marginBottom: 8,
    justifyContent: 'flex-start',
  },
  messageBubbleRowOwn: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '75%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  bubbleOwn: {
    backgroundColor: '#e91e8c',
    borderColor: '#e91e8c',
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 20,
  },
  bubbleTextOwn: {
    color: '#ffffff',
  },
  bubbleTime: {
    color: '#888888',
    fontSize: 10,
    marginTop: 4,
    textAlign: 'right',
  },
  bubbleTimeOwn: {
    color: '#ffffff88',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 120,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e91e8c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
