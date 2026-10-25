import React, { useState } from 'react';
import { Text, View, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';

// --- KONTRAK STATE & DATA DUMMY ---
const dataSesi = { mataKuliah: "Pemrograman Web - Kelas A", waktu: "08:00 - 10:00" };
const dataPraktikan = { id: "24060122140141", nama: "Hafidz Zulfikar" };

export default function Index() {
  const [halamanAktif, setHalamanAktif] = useState('home');
  const [statusSesi, setStatusSesi] = useState('scheduled'); 
  const [statusPresensi, setStatusPresensi] = useState('not_present'); 
  const [rekapHadir, setRekapHadir] = useState<{id: string, nama: string, waktu: string}[]>([]);

  // ==========================================
  // 1. TAMPILAN MENU UTAMA
  // ==========================================
  if (halamanAktif === 'home') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Absensi Praktikum</Text>
        <Text style={styles.subtitle}>Pilih Perspektif Demo:</Text>
        <TouchableOpacity style={[styles.btn, styles.btnPrimer]} onPress={() => setHalamanAktif('asprak')}>
          <Text style={styles.btnText}>👨‍🏫 Masuk sebagai Asprak</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.btnSekunder]} onPress={() => setHalamanAktif('praktikan')}>
          <Text style={styles.btnText}>👨‍🎓 Masuk sebagai Praktikan</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ==========================================
  // 2. TAMPILAN ASPRAK
  // ==========================================
  if (halamanAktif === 'asprak') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Dashboard Asprak</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{dataSesi.mataKuliah}</Text>
          <Text style={styles.cardText}>Status Sesi: {statusSesi.toUpperCase()}</Text>
          
          <View style={styles.row}>
            <TouchableOpacity 
              style={[styles.btn, styles.btnSekunder, { flex: 1, marginRight: 5, opacity: statusSesi !== 'scheduled' ? 0.5 : 1 }]} 
              onPress={() => {
                if(statusSesi !== 'scheduled') return;
                setStatusSesi('ongoing'); 
                Alert.alert('Sukses', 'Sesi berstatus ONGOING. Praktikan bisa presensi.');
              }}
            >
              <Text style={styles.btnText}>Buka Sesi</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.btn, styles.btnPrimer, { flex: 1, marginLeft: 5, opacity: statusSesi === 'completed' ? 0.5 : 1 }]} 
              onPress={() => {
                setStatusSesi('completed'); 
                Alert.alert('Sukses', 'Sesi berstatus COMPLETED. Presensi ditutup.');
              }}
            >
              <Text style={styles.btnText}>Tutup Sesi</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.card, { flex: 1 }]}>
          <Text style={styles.cardTitle}>Live Rekap Kehadiran</Text>
          <ScrollView>
            {rekapHadir.length === 0 ? (
              <Text style={styles.emptyState}>Belum ada data (Empty State)</Text>
            ) : (
              rekapHadir.map((item, index) => (
                <View key={index} style={styles.rekapItem}>
                  <Text style={styles.rekapTextBold}>{item.nama}</Text>
                  <Text style={styles.rekapText}>{item.waktu}</Text>
                </View>
              ))
            )}
          </ScrollView>
        </View>
        
        <TouchableOpacity style={styles.btnBack} onPress={() => setHalamanAktif('home')}>
          <Text style={styles.btnBackText}>Kembali ke Menu</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ==========================================
  // 3. TAMPILAN PRAKTIKAN
  // ==========================================
  if (halamanAktif === 'praktikan') {
    const handlePresensi = () => {
      if (statusSesi === 'scheduled') return Alert.alert('Gagal ❌', 'Sesi belum dibuka (Scheduled).');
      if (statusSesi === 'completed') return Alert.alert('Gagal ❌', 'Sesi sudah selesai (Completed).');
      if (statusPresensi === 'present') return Alert.alert('Info ℹ️', 'Anda sudah melakukan presensi.');

      setStatusPresensi('present');
      setRekapHadir([...rekapHadir, { ...dataPraktikan, waktu: new Date().toLocaleTimeString() }]);
      Alert.alert('Berhasil ✅', 'Status Anda kini PRESENT.');
    };

    return (
      <View style={styles.container}>
        <Text style={styles.title}>Dashboard Praktikan</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{dataSesi.mataKuliah}</Text>
          <Text style={styles.cardText}>Waktu: {dataSesi.waktu}</Text>
          <Text style={styles.cardText}>Status Sesi: {statusSesi.toUpperCase()}</Text>
          <Text style={styles.cardText}>Status Saya: {statusPresensi.toUpperCase()}</Text>
          
          <TouchableOpacity 
            style={[styles.btn, statusSesi === 'ongoing' && statusPresensi === 'not_present' ? styles.btnSekunder : { backgroundColor: '#728C5A', opacity: 0.5 }]} 
            onPress={handlePresensi}
          >
            <Text style={styles.btnText}>Lakukan Presensi</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity style={styles.btnBack} onPress={() => setHalamanAktif('home')}>
          <Text style={styles.btnBackText}>Kembali ke Menu</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

// --- STYLING MENGGUNAKAN PALET WARNA BARU ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EBFADC', padding: 20, paddingTop: 50 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#102F15', textAlign: 'center' },
  subtitle: { fontSize: 16, marginBottom: 20, color: '#728C5A', textAlign: 'center', fontWeight: 'bold' },
  card: { backgroundColor: '#EAF1B1', padding: 20, borderRadius: 10, elevation: 3, marginBottom: 20 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#102F15' },
  cardText: { fontSize: 16, marginBottom: 15, color: '#102F15' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  btn: { padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 10, justifyContent: 'center' },
  btnPrimer: { backgroundColor: '#102F15' },
  btnSekunder: { backgroundColor: '#728C5A' },
  btnText: { color: '#EBFADC', fontSize: 16, fontWeight: 'bold' },
  btnBack: { padding: 10, alignItems: 'center' },
  btnBackText: { color: '#102F15', fontSize: 16, fontWeight: 'bold' },
  emptyState: { fontStyle: 'italic', color: '#728C5A', textAlign: 'center', marginTop: 20 },
  rekapItem: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#728C5A', paddingVertical: 10 },
  rekapTextBold: { fontWeight: 'bold', color: '#102F15' },
  rekapText: { color: '#102F15' }
});