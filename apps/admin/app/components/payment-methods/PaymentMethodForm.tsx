"use client";

import type {
  PaymentFeeType,
  PaymentMethodCategory,
  PaymentMethodType,
} from "@/app/types/PaymentMethod";

const PAYMENT_TYPES: PaymentMethodType[] = [
  "bank_transfer",
  "virtual_account",
  "ewallet",
  "qris",
  "retail",
];
const FEE_TYPES: PaymentFeeType[] = ["fixed", "percent"];

type Props = {
  isOpen: boolean;
  allowCreate?: boolean;
  editingId: string | null;
  success: string;
  submitting: boolean;
  name: string;
  code: string;
  provider: string;
  categoryId: string;
  categories: PaymentMethodCategory[];
  logo: string;
  type: PaymentMethodType;
  feeType: PaymentFeeType;
  feeValue: string;
  currency: string;
  gatewayChannelCode: string;
  description: string;
  isActive: boolean;
  order: string;
  setName: (value: string) => void;
  setCode: (value: string) => void;
  setProvider: (value: string) => void;
  setCategoryId: (value: string) => void;
  setLogo: (value: string) => void;
  setType: (value: PaymentMethodType) => void;
  setFeeType: (value: PaymentFeeType) => void;
  setFeeValue: (value: string) => void;
  setCurrency: (value: string) => void;
  setGatewayChannelCode: (value: string) => void;
  setDescription: (value: string) => void;
  setIsActive: (value: boolean) => void;
  setOrder: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
  onOpen: () => void;
  onClose: () => void;
};

export default function PaymentMethodForm({
  isOpen,
  allowCreate = true,
  editingId,
  success,
  submitting,
  name,
  code,
  provider,
  categoryId,
  categories,
  logo,
  type,
  feeType,
  feeValue,
  currency,
  gatewayChannelCode,
  description,
  isActive,
  order,
  setName,
  setCode,
  setProvider,
  setCategoryId,
  setLogo,
  setType,
  setFeeType,
  setFeeValue,
  setCurrency,
  setGatewayChannelCode,
  setDescription,
  setIsActive,
  setOrder,
  onSubmit,
  onOpen,
  onClose,
}: Props) {
  const title = editingId ? "Perbarui Metode Pembayaran" : "Tambah Metode Pembayaran";
  const fieldClassName = "w-full rounded-xl border border-gray-200 px-4 py-2.5";
  const labelClassName = "mb-2 block text-sm font-medium text-gray-700";

  return (
    <div className="rounded-2xl border bg-white p-5 sm:p-6">
      <h2 className="text-lg font-semibold">{title}</h2>

      {!isOpen && allowCreate ? (
        <button
          type="button"
          onClick={onOpen}
          className="mt-4 flex h-10 w-10 items-center justify-center rounded-full bg-black text-xl text-white shadow-sm transition hover:-translate-y-[1px] hover:bg-gray-800 hover:shadow-md"
          aria-label="Tampilkan form tambah metode pembayaran"
        >
          +
        </button>
      ) : null}

      {success ? (
        <div className="mt-5 rounded-xl bg-green-100 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      ) : null}

      {isOpen ? (
        <form
          onSubmit={onSubmit}
          className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <label className="block">
            <span className={labelClassName}>Nama Metode</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Contoh: BCA Virtual Account"
              className={fieldClassName}
              required
            />
          </label>

          <label className="block">
            <span className={labelClassName}>Kode Metode</span>
            <input
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              placeholder="Contoh: BCA_VA"
              className={fieldClassName}
              required
            />
          </label>

          <label className="block">
            <span className={labelClassName}>Provider</span>
            <input
              value={provider}
              onChange={(event) => setProvider(event.target.value)}
              placeholder="Contoh: manual"
              className={fieldClassName}
            />
          </label>

          <label className="block">
            <span className={labelClassName}>Kategori Pembayaran</span>
            <select
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              className={fieldClassName}
            >
              <option value="">Tanpa kategori</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className={labelClassName}>Urutan Tampil</span>
            <input
              type="number"
              value={order}
              onChange={(event) => setOrder(event.target.value)}
              placeholder="Contoh: 1"
              className={fieldClassName}
              required
            />
          </label>

          <label className="block">
            <span className={labelClassName}>Jenis Pembayaran</span>
            <select
              value={type}
              onChange={(event) => setType(event.target.value as PaymentMethodType)}
              className={fieldClassName}
            >
              {PAYMENT_TYPES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className={labelClassName}>Tipe Biaya</span>
            <select
              value={feeType}
              onChange={(event) =>
                setFeeType(event.target.value as PaymentFeeType)
              }
              className={fieldClassName}
            >
              {FEE_TYPES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className={labelClassName}>
              {feeType === "percent" ? "Biaya (%)" : "Biaya Tetap"}
            </span>
            <input
              type="number"
              value={feeValue}
              onChange={(event) => setFeeValue(event.target.value)}
              placeholder={feeType === "percent" ? "Contoh: 2.5" : "Contoh: 2500"}
              className={fieldClassName}
              required
            />
          </label>

          <label className="block">
            <span className={labelClassName}>Mata Uang</span>
            <input
              value={currency}
              onChange={(event) => setCurrency(event.target.value.toUpperCase())}
              placeholder="IDR"
              className={fieldClassName}
              required
            />
          </label>

          <label className="block">
            <span className={labelClassName}>Kode Channel Gateway</span>
            <input
              value={gatewayChannelCode}
              onChange={(event) => setGatewayChannelCode(event.target.value)}
              placeholder="Untuk mapping gateway nanti"
              className={fieldClassName}
            />
          </label>

          <label className="block sm:col-span-2">
            <span className={labelClassName}>URL Logo</span>
            <input
              value={logo}
              onChange={(event) => setLogo(event.target.value)}
              placeholder="https://..."
              className={fieldClassName}
            />
          </label>

          <label className="block sm:col-span-2 xl:col-span-2">
            <span className={labelClassName}>Deskripsi</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Deskripsi singkat metode pembayaran"
              className="min-h-[110px] w-full rounded-xl border border-gray-200 px-4 py-3"
            />
          </label>

          <label className="block">
            <span className={labelClassName}>Status</span>
            <span className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(event) => setIsActive(event.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              Aktifkan metode pembayaran ini
            </span>
          </label>

          <div className="rounded-xl bg-gray-50 p-4 sm:col-span-2 xl:col-span-3">
            <p className="text-sm text-gray-500">Ringkasan biaya</p>
            <p className="mt-1 text-lg font-semibold text-gray-800">
              {feeType === "percent"
                ? `${Number(feeValue || 0)}% dari total pembayaran`
                : `${currency || "IDR"} ${Number(feeValue || 0)}`}
            </p>
          </div>

          <button
            disabled={submitting}
            className="w-full rounded-xl bg-black py-2 text-white disabled:opacity-50 sm:col-span-2 xl:col-span-4"
          >
            {submitting
              ? "Menyimpan..."
              : editingId
                ? "Simpan Perubahan"
                : "Tambah Metode Pembayaran"}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl border border-gray-200 py-2 text-sm font-medium text-gray-600 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 sm:col-span-2 xl:col-span-4"
          >
            Tutup Form
          </button>
        </form>
      ) : null}
    </div>
  );
}
