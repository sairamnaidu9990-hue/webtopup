"use client";

type Game = {
  _id: string;
  name: string;
  code: string;
  logo?: string;
  provider?: string;
};

type Props = {
  games: Game[];
  onEdit: (game: Game) => void;
  onDelete: (id: string) => void;
};

export default function GameList({ games, onEdit, onDelete }: Props) {
  return (
    <div className="rounded-2xl border bg-white p-6">
      <h2 className="mb-4 text-lg font-semibold">List Games</h2>

      <div className="space-y-3">
        {games.map((game, index) => (
          <div
            key={game._id}
            className="flex items-center justify-between rounded-xl border p-3"
          >
            <div className="flex items-center gap-3">
              <p className="w-6 text-sm text-gray-500">{index + 1}.</p>

              {game.logo && (
                <img
                  src={game.logo}
                  className="h-10 w-10 rounded-lg object-cover"
                />
              )}

              <div>
                <p className="font-medium">{game.name}</p>
                <p className="text-xs text-gray-500">
                   {game.provider} {game.code ? `• ${game.code}` : ""}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => onEdit(game)}
                className="text-sm text-blue-600"
              >
                Edit
              </button>

              <button
                onClick={() => onDelete(game._id)}
                className="text-sm text-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}