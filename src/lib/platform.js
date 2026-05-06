import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import { firebaseApp, firebaseConfigured } from '$lib/firebase';
import { supabase, supabaseConfigured } from '$lib/supabase';

const makeNumbers = (lotteryId) =>
  Array.from({ length: 24 }, (_, index) => ({
    id: `${lotteryId}-${index + 1}`,
    lottery_id: lotteryId,
    number: String(127000 + index * 137 + lotteryId.length * 19),
    status: 'available',
    selected_by: null,
    selected_at: null
  }));

function makeNumbersFromEntries(lottery, entries) {
  const reservedEntries = entries.filter((entry) => entry.lottery_id === lottery.id);
  const reservedMap = new Map(reservedEntries.map((entry) => [entry.number, entry]));
  const totalCount = Math.min(24, Number(lottery.total_numbers ?? 24));
  const numbers = [];

  for (let number = 1; numbers.length < totalCount; number += 1) {
    const entry = reservedMap.get(number);
    numbers.push({
      id: `${lottery.id}-${number}`,
      lottery_id: lottery.id,
      number,
      status: entry ? 'reserved' : 'available',
      selected_by: entry ? entry.user_id : null,
      selected_at: entry ? entry.created_at : null
    });
  }

  const extraReserved = reservedEntries
    .filter((entry) => entry.number > totalCount)
    .map((entry) => ({
      id: `${lottery.id}-${entry.number}`,
      lottery_id: lottery.id,
      number: entry.number,
      status: 'reserved',
      selected_by: entry.user_id,
      selected_at: entry.created_at
    }));

  return [...numbers, ...extraReserved];
}

function mapProfile(user, walletsByUser) {
  return {
    id: user.id,
    firebase_uid: user.firebase_uid,
    full_name: user.name || user.email?.split('@')[0] || 'Guest',
    email: user.email,
    phone: user.phone,
    instagram: user.social_handle,
    x_handle: user.social_handle,
    role: user.role || 'user',
    status: user.is_blocked ? 'blocked' : 'active',
    wallet_balance: Number(walletsByUser[user.id] ?? 0),
    created_at: user.created_at || new Date().toISOString()
  };
}

function mapLottery(lottery, winner, accentIndex) {
  return {
    id: lottery.id,
    title: lottery.name,
    prize: typeof lottery.prize === 'number' ? `$${Number(lottery.prize).toLocaleString()}` : String(lottery.prize),
    ticket_price: Number(lottery.entry_fee),
    draw_date: lottery.draw_time ? lottery.draw_time.slice(0, 10) : null,
    status: lottery.status || 'open',
    winning_number: winner?.number || null,
    winner_profile_id: winner?.user_id || null,
    accent: ['teal', 'violet', 'amber', 'cyan', 'orange'][accentIndex % 5],
    total_numbers: lottery.total_numbers,
    max_entries_per_user: lottery.max_entries_per_user
  };
}

async function loadLiveState(firebaseUid) {
  if (!browser || !supabaseConfigured || !supabase) return null;

  const [usersRes, walletsRes, lotteriesRes, entriesRes, transactionsRes, winnersRes, payoutDetailsRes] =
    await Promise.all([
      supabase
  .from('users')
  .select('id,firebase_uid,name,email,phone,social_handle,is_blocked,role,created_at'),
      supabase.from('wallets').select('user_id,balance'),
      supabase.from('lotteries').select('id,name,entry_fee,prize,total_numbers,max_entries_per_user,draw_time,status,created_at'),
      supabase.from('entries').select('id,user_id,lottery_id,number,created_at'),
      supabase.from('transactions').select('id,user_id,amount,type,source,reference_id,status,created_at'),
      supabase.from('winners').select('id,lottery_id,user_id,entry_id,number,prize,created_at'),
      supabase.from('payout_details').select('id,user_id,upi_id,bank_account,ifsc,account_name,created_at')
    ]);

  if (usersRes.error || walletsRes.error || lotteriesRes.error || entriesRes.error || transactionsRes.error || winnersRes.error || payoutDetailsRes.error) {
    return null;
  }

  const walletsByUser = Object.fromEntries(walletsRes.data.map((wallet) => [wallet.user_id, wallet.balance]));
  const profiles = usersRes.data.map((user) => mapProfile(user, walletsByUser));
  const winnersByLottery = Object.fromEntries(winnersRes.data.map((winner) => [winner.lottery_id, winner]));
  const lotteries = lotteriesRes.data.map((lottery, index) => mapLottery(lottery, winnersByLottery[lottery.id], index));
  const numbers = lotteries.flatMap((lottery) => makeNumbersFromEntries(lottery, entriesRes.data));

  const transactions = transactionsRes.data.map((transaction) => ({
    id: transaction.id,
    profile_id: transaction.user_id,
    type: transaction.type === 'credit' ? 'funding' : transaction.type === 'debit' ? 'play' : transaction.type,
    amount: Number(transaction.amount),
    description: transaction.source || (transaction.type === 'credit' ? 'Deposit' : 'Entry payment'),
    created_at: transaction.created_at || new Date().toISOString()
  }));

  const payoutDetails = payoutDetailsRes.data.map((detail) => ({
    id: detail.id,
    profile_id: detail.user_id,
    lottery_id: null,
    upi_id: detail.upi_id,
    bank_account: detail.bank_account,
    ifsc: detail.ifsc,
    account_name: detail.account_name,
    status: 'pending',
    created_at: detail.created_at || new Date().toISOString()
  }));

  const currentProfile = profiles.find((profile) => profile.firebase_uid === firebaseUid);
  if (!currentProfile) return null;

  return {
    currentUser: {
      uid: currentProfile.firebase_uid,
      email: currentProfile.email,
      displayName: currentProfile.full_name
    },
    activeProfileId: currentProfile.id,
    notice: 'Live Supabase data loaded.',
    profiles,
    lotteries,
    numbers,
    transactions,
    payoutDetails
  };
}

const initialState = {
  currentUser: null,
  activeProfileId: null,
  notice: supabaseConfigured
    ? 'Live Supabase mode is enabled. Data will load once authenticated.'
    : 'Supabase is not configured. Connect the database to load platform data.',
  profiles: [],
  lotteries: [],
  numbers: [],
  transactions: [],
  payoutDetails: []
};

function hydrate() {
  if (!browser) return initialState;
  if (supabaseConfigured) {
    return { ...initialState, notice: 'Live Supabase mode is enabled. Data will load once authenticated.' };
  }

  const stored = localStorage.getItem('lottery-platform-demo');
  if (!stored) return initialState;

  try {
    return { ...initialState, ...JSON.parse(stored) };
  } catch {
    return { ...initialState, notice: 'Local demo data was reset because it could not be read.' };
  }
}

function persist(state) {
  if (!browser) return;
  localStorage.setItem(
    'lottery-platform-demo',
    JSON.stringify({
      currentUser: state.currentUser,
      activeProfileId: state.activeProfileId,
      profiles: state.profiles,
      lotteries: state.lotteries,
      numbers: state.numbers,
      transactions: state.transactions,
      payoutDetails: state.payoutDetails
    })
  );
}

function createPlatformStore() {
  const { subscribe, update, set } = writable(hydrate());

  function commit(mutator) {
    update((state) => {
      const next = mutator(state);
      persist(next);
      return next;
    });
  }

  async function syncUserToSupabase(profile, firebaseUid) {
    if (!supabaseConfigured || !supabase) return;

    try {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('firebase_uid', firebaseUid)
        .maybeSingle();

      if (!existingUser) {
        await supabase.from('users').insert({
          id: profile.id,
          firebase_uid: profile.firebase_uid,
          name: profile.full_name,
          email: profile.email,
          phone: profile.phone,
          social_handle: profile.instagram
        });

        await supabase.from('wallets').insert({
          user_id: profile.id,
          balance: 0
        });
      }
      return true;
    } catch (error) {
      console.error('Error syncing user to Supabase:', error);
      return false;
    }
  }

  async function signUp(form) {
    if (!browser || !firebaseConfigured || !firebaseApp) {
      throw new Error('Firebase auth is not configured.');
    }

    const { getAuth, createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
    const auth = getAuth(firebaseApp);
    const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
    const user = userCredential.user;

    if (form.fullName) {
      await updateProfile(user, { displayName: form.fullName });
    }

    const profile = {
      id: crypto.randomUUID(),
      firebase_uid: user.uid,
      full_name: form.fullName || user.email.split('@')[0],
      email: user.email,
      phone: form.phone,
      instagram: form.instagram,
      x_handle: form.xHandle,
      role: 'user',
      status: 'active',
      wallet_balance: 0,
      created_at: new Date().toISOString()
    };

    commit((state) => ({
      ...state,
      currentUser: { uid: user.uid, email: user.email, displayName: profile.full_name },
      activeProfileId: profile.id,
      profiles: [profile, ...state.profiles.filter((item) => item.email !== profile.email)],
      notice: 'Account created.'
    }));

    const synced = await syncUserToSupabase(profile, user.uid);
    if (synced) {
      commit((state) => ({ ...state, notice: 'Account created and synced successfully.' }));
    } else if (supabaseConfigured) {
      commit((state) => ({ ...state, notice: 'Account created. Database sync failed.' }));
    }
  }


  async function load(firebaseUid) {
  const liveState = await loadLiveState(firebaseUid);

  if (liveState) {
    set(liveState);
  } else {
    commit((state) => ({
      ...state,
      notice: 'No user data found in database.'
    }));
  }

  return liveState;
}
async function signIn(form) {
  if (!browser || !firebaseConfigured || !firebaseApp) {
    throw new Error('Firebase auth is not configured.');
  }

  const { getAuth, signInWithEmailAndPassword } = await import('firebase/auth');
  const auth = getAuth(firebaseApp);
  const userCredential = await signInWithEmailAndPassword(auth, form.email, form.password);
  const user = userCredential.user;

  let profile = null;

  if (supabaseConfigured) {
    profile = await load(user.uid); // already loads full state
  } else {
    commit((state) => {
      const p = state.profiles.find(p => p.firebase_uid === user.uid);
      profile = p;

      return {
        ...state,
        currentUser: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email
        },
        activeProfileId: p?.id
      };
    });
  }

  return profile; // 👈 IMPORTANT
}
  return {
    subscribe,
    reset: async () => {
      if (browser) localStorage.removeItem('lottery-platform-demo');
      set(initialState);
      if (supabaseConfigured) {
        const liveState = await loadLiveState();
        if (liveState) set(liveState);
      }
    },
    load: async (firebaseUid) => {
      const liveState = await loadLiveState(firebaseUid);
      if (liveState) set(liveState);
      return liveState;
    },
    setNotice: (notice) => commit((state) => ({ ...state, notice })),
    useDemoAccount: (profileId) =>
      commit((state) => {
        const profile = state.profiles.find((item) => item.id === profileId);
        if (!profile) return state;
        return {
          ...state,
          currentUser: { uid: profile.firebase_uid, email: profile.email, displayName: profile.full_name },
          activeProfileId: profile.id,
          notice: `Using ${profile.full_name}'s demo account.`
        };
      }),
    createAccount: async (form) => signUp(form),
    signIn: async (form) => signIn(form),
    signUp: async (form) => signUp(form),
    signInWithGoogle: async (firebaseUser) => {
      let currentState = null;
      const unsubscribe = subscribe((state) => {
        currentState = state;
      });
      unsubscribe();

      const existingProfile = currentState?.profiles?.find?.((profile) => profile.email === firebaseUser.email);
      if (existingProfile) {
        commit((state) => ({
          ...state,
          currentUser: {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName ?? firebaseUser.email
          },
          activeProfileId: existingProfile.id,
          notice: `Signed in as ${existingProfile.full_name}.`
        }));
        return;
      }

      const id = crypto.randomUUID();
      const profile = {
        id,
        firebase_uid: firebaseUser.uid,
        full_name: firebaseUser.displayName ?? firebaseUser.email.split('@')[0],
        email: firebaseUser.email,
        phone: '',
        instagram: '',
        x_handle: '',
        role: 'user',
        status: 'active',
        wallet_balance: 0,
        created_at: new Date().toISOString()
      };

      commit((state) => ({
        ...state,
        currentUser: {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName ?? profile.full_name
        },
        activeProfileId: id,
        profiles: [profile, ...state.profiles],
        notice: supabaseConfigured ? 'Signed in with Google. Syncing to database...' : `Signed in as ${profile.full_name}.`
      }));

      const synced = await syncUserToSupabase(profile, firebaseUser.uid);
      if (synced) {
        commit((state) => ({ ...state, notice: `Signed in as ${profile.full_name}.` }));
      } else if (supabaseConfigured) {
        commit((state) => ({ ...state, notice: `Signed in as ${profile.full_name}. Database sync failed.` }));
      }
    },
    updateProfile: (changes) =>
      commit((state) => {
        const activeProfile = getActiveProfile(state);
        if (!activeProfile) return state;

        const updatedProfile = { ...activeProfile, ...changes };
        return {
          ...state,
          currentUser: {
            ...state.currentUser,
            email: updatedProfile.email,
            displayName: updatedProfile.full_name
          },
          profiles: state.profiles.map((profile) => (profile.id === activeProfile.id ? updatedProfile : profile)),
          notice: 'Account details updated.'
        };
      }),
    addFunds: (amount) =>
      commit((state) => {
        const activeProfile = getActiveProfile(state);
        if (!activeProfile || amount <= 0) return state;

        const nextBalance = Number(activeProfile.wallet_balance) + Number(amount);
        const transaction = {
          id: crypto.randomUUID(),
          profile_id: activeProfile.id,
          type: 'funding',
          amount: Number(amount),
          description: 'Wallet top-up',
          created_at: new Date().toISOString()
        };

        return {
          ...state,
          profiles: state.profiles.map((profile) =>
            profile.id === activeProfile.id ? { ...profile, wallet_balance: nextBalance } : profile
          ),
          transactions: [transaction, ...state.transactions],
          notice: `$${Number(amount).toLocaleString()} added to wallet.`
        };
      }),
    reserveNumber: (lotteryId, numberId) =>
      commit((state) => {
        const activeProfile = getActiveProfile(state);
        const lottery = state.lotteries.find((item) => item.id === lotteryId);
        const number = state.numbers.find((item) => item.id === numberId);

        if (!activeProfile || !lottery || !number) return { ...state, notice: 'Choose a lottery number first.' };
        if (number.status !== 'available') return { ...state, notice: 'That number is already reserved.' };
        if (Number(activeProfile.wallet_balance) < Number(lottery.ticket_price)) {
          return { ...state, notice: 'Wallet balance is too low for this entry.' };
        }

        const updatedProfile = {
          ...activeProfile,
          wallet_balance: Number(activeProfile.wallet_balance) - Number(lottery.ticket_price)
        };
        const transaction = {
          id: crypto.randomUUID(),
          profile_id: activeProfile.id,
          type: 'play',
          amount: -Number(lottery.ticket_price),
          description: `${lottery.title} entry ${number.number}`,
          created_at: new Date().toISOString()
        };

        return {
          ...state,
          profiles: state.profiles.map((profile) => (profile.id === activeProfile.id ? updatedProfile : profile)),
          numbers: state.numbers.map((item) =>
            item.id === number.id
              ? { ...item, status: 'reserved', selected_by: activeProfile.id, selected_at: new Date().toISOString() }
              : item
          ),
          transactions: [transaction, ...state.transactions],
          notice: `Entry confirmed for ${lottery.title}.`
        };
      }),
    drawWinner: (lotteryId) =>
      commit((state) => {
        const lottery = state.lotteries.find((item) => item.id === lotteryId);
        const entries = state.numbers.filter((number) => number.lottery_id === lotteryId && number.status === 'reserved');

        if (!lottery || entries.length === 0) return { ...state, notice: 'This lottery has no plays yet.' };

        const winningEntry = entries[Math.floor(Math.random() * entries.length)];
        const updatedLottery = {
          ...lottery,
          status: 'completed',
          winning_number: winningEntry.number,
          winner_profile_id: winningEntry.selected_by
        };

        return {
          ...state,
          lotteries: state.lotteries.map((item) => (item.id === lotteryId ? updatedLottery : item)),
          notice: `${lottery.title} winner selected: ${winningEntry.number}.`
        };
      }),
    addLottery: (lottery) =>
      commit((state) => {
        const id = crypto.randomUUID();
        const nextLottery = {
          id,
          title: lottery.title,
          prize: lottery.prize,
          ticket_price: Number(lottery.ticket_price),
          draw_date: lottery.draw_date,
          status: 'open',
          winning_number: null,
          winner_profile_id: null,
          accent: lottery.accent || 'teal'
        };

        return {
          ...state,
          lotteries: [nextLottery, ...state.lotteries],
          numbers: [...makeNumbers(id), ...state.numbers],
          notice: `${nextLottery.title} created with generated lottery numbers.`
        };
      }),
    updateLotteryStatus: (lotteryId, status) =>
      commit((state) => ({
        ...state,
        lotteries: state.lotteries.map((lottery) => (lottery.id === lotteryId ? { ...lottery, status } : lottery)),
        notice: 'Lottery status updated.'
      })),
    savePayoutDetails: (lotteryId, payout) =>
      commit((state) => {
        const activeProfile = getActiveProfile(state);
        if (!activeProfile) return state;

        const details = {
          id: crypto.randomUUID(),
          profile_id: activeProfile.id,
          lottery_id: lotteryId,
          ...payout,
          status: 'pending',
          created_at: new Date().toISOString()
        };

        return {
          ...state,
          payoutDetails: [details, ...state.payoutDetails.filter((item) => item.lottery_id !== lotteryId)],
          notice: 'Payment details saved for manual payout review.'
        };
      }),
    updateUserStatus: (profileId, status) =>
      commit((state) => ({
        ...state,
        profiles: state.profiles.map((profile) => (profile.id === profileId ? { ...profile, status } : profile)),
        notice: 'User status updated.'
      })),
    updatePayoutStatus: (payoutId, status) =>
      commit((state) => ({
        ...state,
        payoutDetails: state.payoutDetails.map((payout) => (payout.id === payoutId ? { ...payout, status } : payout)),
        notice: 'Payout status updated.'
      }))
  };
}

export const platform = createPlatformStore();

export function getActiveProfile(state) {
  return state.profiles.find((profile) => profile.id === state.activeProfileId) ?? null;
}

export function getWinners(state) {
  return state.lotteries
    .filter((lottery) => lottery.winner_profile_id)
    .map((lottery) => ({
      ...lottery,
      winner: state.profiles.find((profile) => profile.id === lottery.winner_profile_id)
    }));
}

export function getMetrics(state) {
  const today = new Date().toISOString().slice(0, 10);
  return {
    totalWalletBalance: state.profiles.reduce((sum, profile) => sum + Number(profile.wallet_balance), 0),
    dailyIncrease: state.transactions
      .filter((transaction) => transaction.type === 'funding' && transaction.created_at.slice(0, 10) === today)
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0),
    totalPlays: state.numbers.filter((number) => number.status === 'reserved').length,
    registeredUsers: state.profiles.length,
    openLotteries: state.lotteries.filter((lottery) => lottery.status === 'open').length,
    completedLotteries: state.lotteries.filter((lottery) => lottery.status === 'completed').length,
    pendingPayouts: state.payoutDetails.filter((payout) => payout.status === 'pending').length
  };
}

export function getUserEntries(state, profileId) {
  return state.numbers
    .filter((number) => number.selected_by === profileId)
    .map((number) => ({
      ...number,
      lottery: state.lotteries.find((lottery) => lottery.id === number.lottery_id),
      payout: state.payoutDetails.find((payout) => payout.lottery_id === number.lottery_id && payout.profile_id === profileId)
    }));
}

export function getNotifications(state, profileId) {
  const entries = getUserEntries(state, profileId);
  const winnerNotices = entries
    .filter((entry) => entry.lottery?.winner_profile_id)
    .map((entry) => ({
      id: `notice-${entry.id}`,
      title: entry.lottery.winner_profile_id === profileId ? 'You won a lottery' : 'Draw completed',
      body:
        entry.lottery.winner_profile_id === profileId
          ? `${entry.lottery.title} selected your number ${entry.number}. Add payout details.`
          : `${entry.lottery.title} winning number is ${entry.lottery.winning_number}.`,
      created_at: entry.lottery.draw_date,
      tone: entry.lottery.winner_profile_id === profileId ? 'success' : 'neutral'
    }));

  const entryNotices = entries.map((entry) => ({
    id: `entry-${entry.id}`,
    title: 'Entry confirmed',
    body: `${entry.number} is reserved for ${entry.lottery?.title}.`,
    created_at: entry.selected_at,
    tone: 'neutral'
  }));

  return [...winnerNotices, ...entryNotices].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
}
