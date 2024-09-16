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
} from "firebase/firestore";
import { db, auth } from "../../firebase";
import { useAuthState } from "react-firebase-hooks/auth";

interface Memo {
    id: string;
    content: string;
}

export const MemoApp = () => {
    const [user] = useAuthState(auth); // Firebase認証ユーザーの状態を取得
    const [memos, setMemos] = useState<Memo[]>([]);
    const [newMemo, setNewMemo] = useState("");

    useEffect(() => {
        if (user) {
            // ログインユーザーのメモのみ取得
            const q = query(collection(db, "memos"), where("userId", "==", user.uid));
            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                const fetchedMemos: Memo[] = [];
                querySnapshot.forEach((doc) => {
                    fetchedMemos.push({ id: doc.id, content: doc.data().content });
                });
                setMemos(fetchedMemos);
            });
            return () => unsubscribe();
        } else {
            // ログアウト時にメモをクリア
            setMemos([]);
        }
    }, [user]);

    const addMemo = async () => {
        if (newMemo.trim() === "") return;
        try {
            await addDoc(collection(db, "memos"), {
                content: newMemo,
                userId: user?.uid, // ログインユーザーのuidを保存
            });
            setNewMemo(""); // 入力フィールドをクリア
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
        } catch (error) {
            console.error("Error updating memo: ", error);
        }
    };

    return (
        <div>
            <h1 className="text-xl font-bold text-green-400">Memo App</h1>
            {user && (
                <>
                    <div className="flex w-full border border-gray-300 max-w-sm overflow-hidden bg-white rounded-lg shadow-md dark:bg-gray-800">

                        <div className="px-4 py-2 -mx-3">
                            <div className="mx-3">
                                <input
                                    type="text"
                                    value={newMemo}
                                    onChange={(e) => setNewMemo(e.target.value)}
                                    placeholder="Enter new memo"
                                />
                                <button onClick={addMemo}>追加</button>
                            </div>
                        </div>
                    </div>
                </>
            )}
            <ul>
                {memos.map((memo, index) => (
                    <div className="flex w-full border border-gray-300 max-w-sm overflow-hidden bg-white rounded-lg shadow-md dark:bg-gray-800" >
                        <div className="px-4 py-2 -mx-3" >
                            <div className="mx-3" >
                                <li key={memo.id}>
                                    <input
                                        type="text"
                                        value={memo.content}
                                        onChange={(e) => updateMemo(memo.id, e.target.value)}
                                    />
                                    <button onClick={() => deleteMemo(memo.id)}>削除</button>
                                </li>
                            </div>
                        </div>
                    </div>
                ))}
            </ul>
        </div>
    );
};
