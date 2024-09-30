import { useEffect, useState } from "react";
import {
    collection,
    addDoc,
    query,
    where,
    onSnapshot,
    doc,
    deleteDoc,
    updateDoc,
    getDocs,
    arrayUnion,
    getDoc,
} from "firebase/firestore";
import { db, auth } from "../../firebase";
import { useAuthState } from "react-firebase-hooks/auth";

interface Memo {
    id: string;
    content: string;
    userId: string;
    sharedWith: string[];
}

interface User {
    id: string;
    email: string;
    displayName: string;
}

export const MemoApp = () => {
    const [user] = useAuthState(auth);
    const [memos, setMemos] = useState<Memo[]>([]);
    const [newMemo, setNewMemo] = useState("");
    const [sharedEmail, setSharedEmail] = useState("");
    const [editingMemoId, setEditingMemoId] = useState<string | null>(null);
    const [editedContent, setEditedContent] = useState("");
    const [sharedUsers, setSharedUsers] = useState<{ [key: string]: User[] }>({});

    useEffect(() => {
        if (user) {
            const userMemosQuery = query(
                collection(db, "memos"),
                where("userId", "==", user.uid)
            );
            const sharedMemosQuery = query(
                collection(db, "memos"),
                where("sharedWith", "array-contains", user.uid)
            );

            const unsubscribeUserMemos = onSnapshot(userMemosQuery, (querySnapshot) => {
                const fetchedMemos: Memo[] = [];
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    fetchedMemos.push({ id: doc.id, ...data } as Memo);
                });
                setMemos((prevMemos) => [...prevMemos, ...fetchedMemos]);
            });

            const unsubscribeSharedMemos = onSnapshot(sharedMemosQuery, (querySnapshot) => {
                const fetchedMemos: Memo[] = [];
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    fetchedMemos.push({ id: doc.id, ...data } as Memo);
                });
                setMemos((prevMemos) => [...prevMemos, ...fetchedMemos]);
            });

            return () => {
                unsubscribeUserMemos();
                unsubscribeSharedMemos();
            };
        } else {
            setMemos([]);
        }
    }, [user]);

    useEffect(() => {
        const fetchSharedUsers = async () => {
            const sharedUsersMap: { [key: string]: User[] } = {};
            for (const memo of memos) {
                const users = [];
                for (const sharedUserId of memo.sharedWith) {
                    const userDoc = await getDoc(doc(db, "users", sharedUserId));
                    if (userDoc.exists()) {
                        users.push({ id: userDoc.id, ...userDoc.data() } as User);
                    }
                }
                sharedUsersMap[memo.id] = users;
            }
            setSharedUsers(sharedUsersMap);
        };

        if (memos.length > 0) {
            fetchSharedUsers();
        }
    }, [memos]);

    const addMemo = async () => {
        if (newMemo.trim() === "") return;
        try {
            await addDoc(collection(db, "memos"), {
                content: newMemo,
                userId: user?.uid,
                sharedWith: [],
            });
            setNewMemo("");
        } catch (error) {
            console.error("Error adding memo: ", error);
        }
    };

    const deleteMemo = async (id: string) => {
        try {
            await deleteDoc(doc(db, "memos", id));
        } catch (error) {
            console.error("Error deleting memo: ", error);
        }
    };

    const updateMemo = async (id: string, newContent: string) => {
        try {
            await updateDoc(doc(db, "memos", id), { content: newContent });
            setEditingMemoId(null); // 編集モード終了
        } catch (error) {
            console.error("Error updating memo: ", error);
        }
    };

    const shareMemo = async (memoId: string, email: string) => {
        try {
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("email", "==", email));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const userToShare = querySnapshot.docs[0];
                const userIdToShare = userToShare.id;

                const memoRef = doc(db, "memos", memoId);
                await updateDoc(memoRef, {
                    sharedWith: arrayUnion(userIdToShare),
                });

                console.log(`メモを ${email} と共有しました`);
            } else {
                console.error("指定されたユーザーが見つかりませんでした");
            }
        } catch (error) {
            console.error("Error sharing memo: ", error);
        }
    };

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Memo App</h1>
            {user && (
                <>
                    <div className="flex items-center space-x-2 mb-4">
                        <input
                            type="text"
                            value={newMemo}
                            onChange={(e) => setNewMemo(e.target.value)}
                            placeholder="Enter new memo"
                            className="border p-2 rounded"
                        />
                        <button onClick={addMemo} className="bg-green-500 text-white p-2 rounded">
                            Add Memo
                        </button>
                    </div>
                </>
            )}
            <ul>
                {memos.map((memo) => (
                    <li key={memo.id} className="mb-4 border p-4 rounded shadow">
                        {editingMemoId === memo.id ? (
                            <>
                                <input
                                    type="text"
                                    value={editedContent}
                                    onChange={(e) => setEditedContent(e.target.value)}
                                    className="border p-2 rounded w-full"
                                />
                                <button
                                    onClick={() => updateMemo(memo.id, editedContent)}
                                    className="bg-blue-500 text-white p-2 rounded mt-2"
                                >
                                    Save
                                </button>
                            </>
                        ) : (
                            <>
                                <p>{memo.content}</p>
                                <button
                                    onClick={() => {
                                        setEditingMemoId(memo.id);
                                        setEditedContent(memo.content);
                                    }}
                                    className="bg-yellow-500 text-white p-2 rounded mt-2"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => deleteMemo(memo.id)}
                                    className="bg-red-500 text-white p-2 rounded ml-2"
                                    disabled={memo.userId !== user?.uid}
                                >
                                    Delete
                                </button>
                                {memo.userId === user?.uid && (
                                    <div className="mt-2">
                                        <input
                                            type="text"
                                            placeholder="Share with email"
                                            onChange={(e) => setSharedEmail(e.target.value)}
                                            className="border p-2 rounded w-full"
                                        />
                                        <button
                                            onClick={() => shareMemo(memo.id, sharedEmail)}
                                            className="bg-blue-500 text-white p-2 rounded mt-2"
                                        >
                                            Share
                                        </button>
                                    </div>
                                )}
                                {sharedUsers[memo.id] && sharedUsers[memo.id].length > 0 && (
                                    <div className="mt-2">
                                        <p className="text-sm font-semibold">Shared with:</p>
                                        <ul>
                                            {sharedUsers[memo.id].map((sharedUser) => (
                                                <li key={sharedUser.id}>{sharedUser.displayName || sharedUser.email}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
};
