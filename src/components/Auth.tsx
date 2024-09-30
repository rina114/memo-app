import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { auth, db } from "../../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { doc, setDoc } from "firebase/firestore";

export const Auth = () => {
    const [user] = useAuthState(auth);

    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        if (result.user) {
            // ログイン成功時に Firestore にユーザー情報を保存
            const userRef = doc(db, "users", result.user.uid);
            await setDoc(userRef, {
                uid: result.user.uid,
                email: result.user.email,
                displayName: result.user.displayName,
            }, { merge: true });
        }
    };

    const logout = () => {
        signOut(auth);
    };

    return (
        <div className="p-4">
            {user ? (
                <>
                    <p>Logged in as {user.displayName}</p>
                    <button onClick={logout} className="bg-red-500 text-white p-2 rounded">Logout</button>
                </>
            ) : (
                <button onClick={signInWithGoogle} className="bg-blue-500 text-white p-2 rounded">Sign in with Google</button>
            )}
        </div>
    );
};
