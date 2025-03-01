import React, { useState } from 'react';
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Alert,
  Paper,
  Input,
} from '@mui/material';
import * as XLSX from 'xlsx';
import api from '../services/api';

export default function AddSong() {
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    originalKey: '',
    chords: '',
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await api.post('/songs', formData);
      setSuccess('Şarkı başarıyla eklendi');
      setFormData({
        title: '',
        artist: '',
        originalKey: '',
        chords: '',
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Şarkı eklenirken bir hata oluştu');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    setError('');
    setSuccess('');

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      let successCount = 0;
      let errorCount = 0;

      for (const row of jsonData) {
        try {
          await api.post('/songs', {
            title: row.title || row['Şarkı Adı'],
            artist: row.artist || row['Sanatçı'],
            originalKey: row.originalKey || row['Ton'],
            chords: row.chords || row['Akorlar'],
          });
          successCount++;
        } catch (err) {
          console.error('Error adding song:', err);
          errorCount++;
        }
      }

      setSuccess(`${successCount} şarkı başarıyla eklendi${errorCount > 0 ? `, ${errorCount} şarkı eklenemedi` : ''}`);
    } catch (err) {
      setError('Excel dosyası işlenirken bir hata oluştu');
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Şarkı Ekle
        </Typography>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Tekli Şarkı Ekle
          </Typography>

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Şarkı Adı"
              name="title"
              value={formData.title}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Sanatçı"
              name="artist"
              value={formData.artist}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Ton"
              name="originalKey"
              value={formData.originalKey}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Akorlar"
              name="chords"
              multiline
              rows={4}
              value={formData.chords}
              onChange={handleChange}
            />
            <Button
              type="submit"
              variant="contained"
              sx={{ mt: 3 }}
            >
              Şarkı Ekle
            </Button>
          </Box>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Excel ile Toplu Şarkı Ekle
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Excel dosyanızda "title/Şarkı Adı", "artist/Sanatçı", "originalKey/Ton" ve "chords/Akorlar" sütunları bulunmalıdır.
          </Typography>
          <Input
            type="file"
            onChange={handleFileUpload}
            sx={{ mt: 2 }}
            inputProps={{
              accept: '.xlsx, .xls'
            }}
          />
        </Paper>
      </Box>
    </Container>
  );
}
