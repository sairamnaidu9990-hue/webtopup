import GamesPageClient from "@/app/components/games/GamesPageClient";

export default function BangjeffGamesPage() {
  return <GamesPageClient syncSource="bangjeff" allowCreate={false} />;
}
