import GamesPageClient from "@/app/components/games/GamesPageClient";

export default function ManualGamesPage() {
  return <GamesPageClient syncSource="manual" allowCreate />;
}
