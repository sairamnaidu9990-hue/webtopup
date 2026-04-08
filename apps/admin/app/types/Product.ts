export type Game = {
  _id: string;
  name: string;
};

export type Product = {
  _id: string;
  name: string;
  basePrice: number;
  markup: number;
  price: number;
  providerCode?: string;
  logo?: string;
  game?: Game;
};
