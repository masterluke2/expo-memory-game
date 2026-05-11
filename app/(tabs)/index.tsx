import React, { useEffect, useState } from 'react';
import {
    Dimensions,
    Modal,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

type Card = {
  id: string;
  emoji: string;
};

const ANIMALS = ['🦁', '🐼', '🦊', '🐸', '🐙', '🦄', '🐢', '🦋'];

const { width } = Dimensions.get('window');
const CARD_SIZE = (width - 80) / 4;

const generateShuffledCards = (): Card[] => {
  const cards: Card[] = [];
  ANIMALS.forEach((emoji, index) => {
    cards.push({ id: `${index}-a`, emoji });
    cards.push({ id: `${index}-b`, emoji });
  });
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
};

export default function App() {
  const [cards, setCards] = useState<Card[]>(generateShuffledCards());
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [revealedHistory, setRevealedHistory] = useState<Record<string, number>>({});
  const [score, setScore] = useState<number>(0);
  const [moves, setMoves] = useState<number>(0);
  const [disabled, setDisabled] = useState<boolean>(false);
  const [timer, setTimer] = useState<number>(0);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [showWinModal, setShowWinModal] = useState<boolean>(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (gameStarted && matched.length < cards.length) {
      interval = setInterval(() => {
        setTimer((t) => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameStarted, matched.length, cards.length]);

  useEffect(() => {
    if (matched.length === cards.length && cards.length > 0) {
      setTimeout(() => setShowWinModal(true), 500);
    }
  }, [matched, cards.length]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCardPress = (index: number) => {
    if (disabled) return;
    if (flipped.includes(index)) return;
    if (matched.includes(index)) return;

    if (!gameStarted) setGameStarted(true);

    const cardId = cards[index].id;
    const prevCount = revealedHistory[cardId] || 0;
    if (prevCount >= 1) {
      setScore((s) => s - 1);
    }
    setRevealedHistory((prev) => ({
      ...prev,
      [cardId]: prevCount + 1,
    }));

    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setDisabled(true);
      setMoves((m) => m + 1);
      const [first, second] = newFlipped;
      if (cards[first].emoji === cards[second].emoji) {
        setTimeout(() => {
          setMatched((prev) => [...prev, first, second]);
          setScore((s) => s + 20);
          setFlipped([]);
          setDisabled(false);
        }, 600);
      } else {
        setTimeout(() => {
          setFlipped([]);
          setDisabled(false);
        }, 1000);
      }
    }
  };

  const resetGame = () => {
    setCards(generateShuffledCards());
    setFlipped([]);
    setMatched([]);
    setRevealedHistory({});
    setScore(0);
    setMoves(0);
    setDisabled(false);
    setTimer(0);
    setGameStarted(false);
    setShowWinModal(false);
  };

  const progress = (matched.length / cards.length) * 100;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />

      <View style={styles.header}>
        <Text style={styles.title}>🎴 Animal Memory</Text>
        <Text style={styles.subtitle}>Find all the matching pairs!</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statIcon}>⏱️</Text>
          <Text style={styles.statValue}>{formatTime(timer)}</Text>
          <Text style={styles.statLabel}>Time</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statIcon}>🏆</Text>
          <Text style={[styles.statValue, { color: '#FFD700' }]}>{score}</Text>
          <Text style={styles.statLabel}>Score</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statIcon}>🎯</Text>
          <Text style={[styles.statValue, { color: '#4ECDC4' }]}>{moves}</Text>
          <Text style={styles.statLabel}>Moves</Text>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {matched.length / 2} / {cards.length / 2} pairs
        </Text>
      </View>

      <View style={styles.grid}>
        {cards.map((card, index) => {
          const isFlipped = flipped.includes(index) || matched.includes(index);
          const isMatched = matched.includes(index);
          return (
            <TouchableOpacity
              key={card.id}
              style={[
                styles.card,
                { width: CARD_SIZE, height: CARD_SIZE },
                isFlipped && styles.cardFlipped,
                isMatched && styles.cardMatched,
              ]}
              onPress={() => handleCardPress(index)}
              activeOpacity={0.7}
              disabled={disabled}
            >
              {isFlipped ? (
                <Text style={styles.cardEmoji}>{card.emoji}</Text>
              ) : (
                <Text style={styles.cardBack}>✨</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <Modal
        visible={showWinModal}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.winEmoji}>🏆</Text>
            <Text style={styles.winTitle}>You Won!</Text>
            <Text style={styles.winSubtitle}>
              Awesome! You matched all the pairs!
            </Text>

            {/* Stats Summary */}
            <View style={styles.winStatsContainer}>
              <View style={styles.winStatRow}>
                <Text style={styles.winStatLabel}>⏱️  Time</Text>
                <Text style={styles.winStatValue}>{formatTime(timer)}</Text>
              </View>
              <View style={styles.winStatRow}>
                <Text style={styles.winStatLabel}>🎯  Moves</Text>
                <Text style={styles.winStatValue}>{moves}</Text>
              </View>
              <View style={styles.winStatRow}>
                <Text style={styles.winStatLabel}>🏆  Final Score</Text>
                <Text style={[styles.winStatValue, { color: '#FFD700' }]}>
                  {score}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.resetBtn}
              onPress={resetGame}
              activeOpacity={0.8}
            >
              <Text style={styles.resetBtnText}>🔄  Play Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 13,
    color: '#9d9dc7',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 12,
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#252541',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333357',
  },
  statIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 11,
    color: '#9d9dc7',
    marginTop: 2,
  },
  progressContainer: {
    marginVertical: 10,
  },
  progressBg: {
    height: 8,
    backgroundColor: '#252541',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4ECDC4',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#9d9dc7',
    textAlign: 'center',
    marginTop: 6,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 10,
  },
  card: {
    backgroundColor: '#3d3d6b',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 2,
    borderColor: '#4a4a7a',
  },
  cardFlipped: {
    backgroundColor: '#fff',
    borderColor: '#4ECDC4',
  },
  cardMatched: {
    backgroundColor: '#d4f5e9',
    borderColor: '#27AE60',
    opacity: 0.85,
  },
  cardEmoji: {
    fontSize: 36,
  },
  cardBack: {
    fontSize: 28,
    color: '#9d9dc7',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#252541',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    borderWidth: 2,
    borderColor: '#FFD700',
    elevation: 10,
    shadowColor: '#FFD700',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  winEmoji: {
    fontSize: 64,
    marginBottom: 8,
  },
  winTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 6,
  },
  winSubtitle: {
    fontSize: 14,
    color: '#9d9dc7',
    textAlign: 'center',
    marginBottom: 24,
  },
  winStatsContainer: {
    width: '100%',
    backgroundColor: '#1a1a2e',
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
  },
  winStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  winStatLabel: {
    fontSize: 15,
    color: '#9d9dc7',
  },
  winStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  resetBtn: {
    backgroundColor: '#4ECDC4',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#4ECDC4',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  resetBtnText: {
    color: '#1a1a2e',
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});
