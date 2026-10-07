// Public content for the department homepage.
//
// Figures: UpBase company-wide, as published on upbase.asia ("UpBase is in the
// 2026 Numbers"). Temporary until the Director provides TTVH2's own figures.
// Brands: logos hotlinked from upbase.asia, limited to files whose name
// identifies the brand. Not a list of brands run by TTVH2.

export const UPBASE_SOURCE = "https://upbase.asia/";

export const UPBASE_STATS = [
  { key: "statPeople", value: "600+" },
  { key: "statBrands", value: "100+" },
  { key: "statGmv", value: "$300M+" },
] as const;

const CDN = "https://cdn.prod.website-files.com/67d77474ac7150f21af5ec99/";

export const UPBASE_BRAND_LOGOS: { name: string; src: string }[] = [
  { name: "Thế Giới Di Động", src: `${CDN}67e8e18f7461f6671f04dfff_tgdd-logo.avif` },
  { name: "Ziaja", src: `${CDN}6a09be9288359cf5daa92259_ziaja.png` },
  { name: "Eubos", src: `${CDN}6a09be9288359cf5daa92282_eubos.png` },
  { name: "Cathy Doll", src: `${CDN}6a0bc56b5c78285aea3218d5_CATHY_DOLL_2024-02.png` },
  { name: "Pigeon", src: `${CDN}67e6566a506cfd8ff6f3410a_Property%201%3Dpigeon.avif` },
  { name: "Khaokho", src: `${CDN}67e6566ae31ca237412520cd_Property%201%3Dkhaokho.avif` },
  { name: "Cam Nguyen", src: `${CDN}67e6a26511e9cae58f52261c_camnguyen1-4069.avif` },
  { name: "Royal Asunz", src: `${CDN}67e75b378c1741b55f2e4d6b_Property%201%3Droyal%20asunz.avif` },
  { name: "Astalift", src: `${CDN}67e75d6a729c7d1dbfdce4c3_astalift_logo.avif` },
  { name: "Karmart", src: `${CDN}67e75d6a40bd3dc57f378426_karmart_logo.avif` },
  { name: "Elprairie", src: `${CDN}67e75d8bd64a6bffc137d423_Property%201%3Delprairie.avif` },
  { name: "Natureway", src: `${CDN}67e75d9e34ca048c2382b284_Property%201%3Dnatureway.avif` },
  { name: "Vitabiotics", src: `${CDN}67e75db7b72b74b574437ab9_Property%201%3Dvitabiotics.avif` },
  { name: "Nabizam", src: `${CDN}67e75e01b67b3fdcfbf3218d_Property%201%3Dnabizam.avif` },
  { name: "Fysoline", src: `${CDN}67e75e1474ca397196fff3cc_Property%201%3Dfysoline.avif` },
  { name: "Dr.Papie", src: `${CDN}67e75e36729c7d1dbfdd42e7_drpapie_logo.avif` },
  {
    name: "Dược Bắc Ninh",
    src: `${CDN}67e75e4db72b74b57443bae2_Property%201%3DD%C6%B0%E1%BB%A3c%20b%E1%BA%AFc%20ninh%20(1)%201.avif`,
  },
  { name: "Alice", src: `${CDN}67e75f850e3d61d0f8b42bd8_alice-logo.avif` },
  { name: "Miusilver", src: `${CDN}67e75f857668433e9e56d9ef_miusilver-logo.avif` },
  { name: "Meracine", src: `${CDN}67e75f85d858ae689e1168b3_meracine-logo.avif` },
];
