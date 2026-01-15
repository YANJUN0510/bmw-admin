export interface BuildingMaterial {
  code: string;
  name: string;
  category: string;
  series: string | null;
  image: string | File;
  gallery?: (string | File)[];
  description: string;
  specs?: { label: string; value: string }[];
  price?: string | null;
  created_at?: string;
}
