import { CommodityCategory } from '@prisma/client';

export interface CommoditySeedData {
  name: string;
  category: CommodityCategory;
  unit: string;
  shelfLifeDays: number;
  wastePercent: number; // e.g. 0.15 for 15%
  floorPrice: number;
  referencePrice: number;
  ceilingPrice: number;
}

export const COMMODITIES_SEED_DATA: CommoditySeedData[] = [
  {
    name: 'Bayam',
    category: CommodityCategory.VEGETABLE,
    unit: 'kg',
    shelfLifeDays: 3,
    wastePercent: 0.15,
    floorPrice: 6000,
    referencePrice: 8000,
    ceilingPrice: 12000,
  },
  {
    name: 'Kangkung',
    category: CommodityCategory.VEGETABLE,
    unit: 'kg',
    shelfLifeDays: 3,
    wastePercent: 0.15,
    floorPrice: 5000,
    referencePrice: 7000,
    ceilingPrice: 10000,
  },
  {
    name: 'Wortel',
    category: CommodityCategory.VEGETABLE,
    unit: 'kg',
    shelfLifeDays: 10,
    wastePercent: 0.08,
    floorPrice: 9000,
    referencePrice: 12000,
    ceilingPrice: 16000,
  },
  {
    name: 'Tomat',
    category: CommodityCategory.VEGETABLE,
    unit: 'kg',
    shelfLifeDays: 6,
    wastePercent: 0.1,
    floorPrice: 10000,
    referencePrice: 14000,
    ceilingPrice: 20000,
  },
  {
    name: 'Cabai rawit',
    category: CommodityCategory.SPICE,
    unit: 'kg',
    shelfLifeDays: 5,
    wastePercent: 0.05,
    floorPrice: 30000,
    referencePrice: 45000,
    ceilingPrice: 80000,
  },
  {
    name: 'Bawang merah',
    category: CommodityCategory.SPICE,
    unit: 'kg',
    shelfLifeDays: 21,
    wastePercent: 0.08,
    floorPrice: 28000,
    referencePrice: 35000,
    ceilingPrice: 55000,
  },
  {
    name: 'Telur ayam',
    category: CommodityCategory.POULTRY_EGG,
    unit: 'kg',
    shelfLifeDays: 14,
    wastePercent: 0.03,
    floorPrice: 24000,
    referencePrice: 28000,
    ceilingPrice: 34000,
  },
  {
    name: 'Ikan lele',
    category: CommodityCategory.FISH,
    unit: 'kg',
    shelfLifeDays: 2,
    wastePercent: 0.1,
    floorPrice: 26000,
    referencePrice: 30000,
    ceilingPrice: 38000,
  },
  {
    name: 'Ikan nila',
    category: CommodityCategory.FISH,
    unit: 'kg',
    shelfLifeDays: 2,
    wastePercent: 0.1,
    floorPrice: 28000,
    referencePrice: 33000,
    ceilingPrice: 42000,
  },
  {
    name: 'Ayam potong',
    category: CommodityCategory.POULTRY_EGG,
    unit: 'kg',
    shelfLifeDays: 2,
    wastePercent: 0.05,
    floorPrice: 32000,
    referencePrice: 38000,
    ceilingPrice: 46000,
  },
  {
    name: 'Tempe',
    category: CommodityCategory.PROTEIN_PROCESSED,
    unit: 'kg',
    shelfLifeDays: 2,
    wastePercent: 0.03,
    floorPrice: 18000,
    referencePrice: 22000,
    ceilingPrice: 28000,
  },
  {
    name: 'Beras',
    category: CommodityCategory.STAPLE,
    unit: 'kg',
    shelfLifeDays: 180,
    wastePercent: 0.02,
    floorPrice: 12000,
    referencePrice: 14000,
    ceilingPrice: 17000,
  },
  {
    name: 'Pisang',
    category: CommodityCategory.FRUIT,
    unit: 'kg',
    shelfLifeDays: 5,
    wastePercent: 0.1,
    floorPrice: 13000,
    referencePrice: 18000,
    ceilingPrice: 24000,
  },
];

// Fix cabai rawit ceilingPrice: 80000
COMMODITIES_SEED_DATA[4].ceilingPrice = 80000;

export const DEFAULT_QUALITY_CHECKLIST = [
  { key: 'freshness', label: 'Kesegaran', weight: 40 },
  { key: 'physical_condition', label: 'Kondisi fisik/cacat', weight: 25 },
  { key: 'size_uniformity', label: 'Keseragaman ukuran', weight: 15 },
  { key: 'cleanliness', label: 'Kebersihan', weight: 10 },
  { key: 'handling_temperature', label: 'Penanganan/suhu', weight: 10 },
];

export interface RecipeItemSeed {
  commodityName: string;
  quantityPerPortion: number; // kg per porsi
}

export interface RecipeSeedData {
  name: string;
  description: string;
  items: RecipeItemSeed[];
}

export const RECIPES_SEED_DATA: RecipeSeedData[] = [
  {
    name: 'R1 Nasi, Lele Goreng, Tumis Bayam, Pisang',
    description: 'Menu Senin: Beras 0.08 kg, Lele 0.07 kg, Bayam 0.06 kg, Bawang merah 0.01 kg, Pisang 0.07 kg',
    items: [
      { commodityName: 'Beras', quantityPerPortion: 0.08 },
      { commodityName: 'Ikan lele', quantityPerPortion: 0.07 },
      { commodityName: 'Bayam', quantityPerPortion: 0.06 },
      { commodityName: 'Bawang merah', quantityPerPortion: 0.01 },
      { commodityName: 'Pisang', quantityPerPortion: 0.07 },
    ],
  },
  {
    name: 'R2 Nasi, Telur Balado, Sup Wortel',
    description: 'Menu Selasa: Beras 0.08 kg, Telur ayam 0.06 kg, Wortel 0.05 kg, Tomat 0.02 kg, Cabai rawit 0.005 kg, Bawang merah 0.01 kg',
    items: [
      { commodityName: 'Beras', quantityPerPortion: 0.08 },
      { commodityName: 'Telur ayam', quantityPerPortion: 0.06 },
      { commodityName: 'Wortel', quantityPerPortion: 0.05 },
      { commodityName: 'Tomat', quantityPerPortion: 0.02 },
      { commodityName: 'Cabai rawit', quantityPerPortion: 0.005 },
      { commodityName: 'Bawang merah', quantityPerPortion: 0.01 },
    ],
  },
  {
    name: 'R3 Nasi, Ayam Goreng, Capcay Kangkung',
    description: 'Menu Rabu: Beras 0.08 kg, Ayam potong 0.07 kg, Kangkung 0.06 kg, Wortel 0.03 kg, Bawang merah 0.01 kg, Pisang 0.07 kg',
    items: [
      { commodityName: 'Beras', quantityPerPortion: 0.08 },
      { commodityName: 'Ayam potong', quantityPerPortion: 0.07 },
      { commodityName: 'Kangkung', quantityPerPortion: 0.06 },
      { commodityName: 'Wortel', quantityPerPortion: 0.03 },
      { commodityName: 'Bawang merah', quantityPerPortion: 0.01 },
      { commodityName: 'Pisang', quantityPerPortion: 0.07 },
    ],
  },
  {
    name: 'R4 Nasi, Tempe Orek, Telur Rebus, Sayur Bening',
    description: 'Menu Kamis: Beras 0.08 kg, Tempe 0.05 kg, Telur ayam 0.06 kg, Bayam 0.05 kg, Wortel 0.02 kg',
    items: [
      { commodityName: 'Beras', quantityPerPortion: 0.08 },
      { commodityName: 'Tempe', quantityPerPortion: 0.05 },
      { commodityName: 'Telur ayam', quantityPerPortion: 0.06 },
      { commodityName: 'Bayam', quantityPerPortion: 0.05 },
      { commodityName: 'Wortel', quantityPerPortion: 0.02 },
    ],
  },
  {
    name: 'R5 Nasi, Nila Bakar, Lalap Tomat Kangkung',
    description: 'Menu Jumat: Beras 0.08 kg, Ikan nila 0.08 kg, Kangkung 0.04 kg, Tomat 0.04 kg, Cabai rawit 0.005 kg, Pisang 0.07 kg',
    items: [
      { commodityName: 'Beras', quantityPerPortion: 0.08 },
      { commodityName: 'Ikan nila', quantityPerPortion: 0.08 },
      { commodityName: 'Kangkung', quantityPerPortion: 0.04 },
      { commodityName: 'Tomat', quantityPerPortion: 0.04 },
      { commodityName: 'Cabai rawit', quantityPerPortion: 0.005 },
      { commodityName: 'Pisang', quantityPerPortion: 0.07 },
    ],
  },
];
