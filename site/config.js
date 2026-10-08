/* Acelere Screen — configuração da landing de download.
   A "publishable key" do Supabase é pública por design (a segurança fica nas regras de RLS).
   É o mesmo projeto e a mesma tabela "leads" do CRM da Acelere Tech. */
window.ACELERE_SCREEN = {
  supabase: {
    url: 'https://dltcahvplqwfcaguxlil.supabase.co',
    key: 'sb_publishable_qJlaISK72LK5nRerPrjOMQ_tt8VgtlF'
  },
  // Instaladores publicados como release em github.com/luizpessatto/acelere-screen-downloads.
  // "latest" aponta sempre para a release mais recente, desde que os nomes dos arquivos se mantenham.
  downloads: {
    mac: { url: 'https://github.com/luizpessatto/acelere-screen-downloads/releases/latest/download/Acelere-Screen.dmg', file: 'Acelere-Screen.dmg', size: '111 MB' },
    macIntel: { url: 'https://github.com/luizpessatto/acelere-screen-downloads/releases/latest/download/Acelere-Screen-Intel.dmg', file: 'Acelere-Screen-Intel.dmg', size: '120 MB' },
    win: { url: 'https://github.com/luizpessatto/acelere-screen-downloads/releases/latest/download/Acelere-Screen-Setup.exe', file: 'Acelere-Screen-Setup.exe', size: '86 MB' }
  },
  version: '1.1.39'
};
