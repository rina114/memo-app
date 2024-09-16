import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { auth } from "../../firebase";
import { useAuthState } from "react-firebase-hooks/auth";

export const Auth = () => {
    const [user] = useAuthState(auth);

    const signInWithGoogle = () => {
        const provider = new GoogleAuthProvider();
        signInWithPopup(auth, provider);
    };

    const logout = () => {
        signOut(auth);
    };

    return (
        <div>
            {user ? (
                <>
                    <p>Logged in as {user.displayName}</p>
                    <button onClick={logout}>Logout</button>
                </>
            ) : (

                <button onClick={signInWithGoogle}>Sign in with Google</button>

            )
            }
        </div >
    );
};