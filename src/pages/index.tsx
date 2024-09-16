import { Auth } from "../components/Auth";
import { MemoApp } from "../components/MemoApp";

export default function HomePage() {
  return (
    <div>
      <Auth />
      <MemoApp />
    </div>
  );
}
