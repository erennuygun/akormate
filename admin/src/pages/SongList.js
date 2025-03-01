import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Typography,
  Container,
  Paper,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Alert,
  Snackbar,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import DeleteIcon from '@mui/icons-material/Delete';
import LabelIcon from '@mui/icons-material/Label';
import api from '../services/api';

const columns = [
  { field: '_id', headerName: 'ID', width: 220 },
  { field: 'title', headerName: 'Şarkı Adı', width: 200 },
  { field: 'artist', headerName: 'Sanatçı', width: 200 },
  { field: 'originalKey', headerName: 'Ton', width: 100 },
  { 
    field: 'tag', 
    headerName: 'Tag', 
    width: 120,
    renderCell: (params) => (
      <Box
        sx={{
          backgroundColor: 
            params.value === 'popular' ? '#ff9800' :
            params.value === 'new' ? '#4caf50' : '#9e9e9e',
          color: 'white',
          padding: '3px 10px',
          borderRadius: '12px',
          fontSize: '0.75rem'
        }}
      >
        {params.value.toUpperCase()}
      </Box>
    )
  },
  {
    field: 'created_at',
    headerName: 'Eklenme Tarihi',
    width: 200,
    valueFormatter: (params) => {
      return new Date(params.value).toLocaleString('tr-TR');
    },
  },
];

const TAG_OPTIONS = [
  { value: 'normal', label: 'Normal' },
  { value: 'popular', label: 'Popular' },
  { value: 'new', label: 'New' }
];

export default function SongList() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [artistFilter, setArtistFilter] = useState('');
  const [selectedSongs, setSelectedSongs] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openTagDialog, setOpenTagDialog] = useState(false);
  const [selectedTag, setSelectedTag] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadSongs();
  }, []);

  const loadSongs = async () => {
    try {
      const response = await api.get('/songs');
      setSongs(response.data);
    } catch (error) {
      console.error('Error loading songs:', error);
      setSnackbar({
        open: true,
        message: 'Şarkılar yüklenirken bir hata oluştu',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSelected = async () => {
    try {
      await api.delete('/songs/batch', {
        data: { songIds: selectedSongs }
      });
      
      setSnackbar({
        open: true,
        message: `${selectedSongs.length} şarkı başarıyla silindi`,
        severity: 'success'
      });
      
      loadSongs();
      setSelectedSongs([]);
      setOpenDialog(false);
    } catch (error) {
      console.error('Error deleting songs:', error);
      setSnackbar({
        open: true,
        message: 'Şarkılar silinirken bir hata oluştu',
        severity: 'error'
      });
    }
  };

  const handleUpdateTags = async () => {
    try {
      await api.put('/songs/batch/tag', {
        songIds: selectedSongs,
        tag: selectedTag
      });
      
      setSnackbar({
        open: true,
        message: `${selectedSongs.length} şarkının tag'i güncellendi`,
        severity: 'success'
      });
      
      loadSongs();
      setSelectedSongs([]);
      setOpenTagDialog(false);
    } catch (error) {
      console.error('Error updating tags:', error);
      setSnackbar({
        open: true,
        message: 'Tag\'ler güncellenirken bir hata oluştu',
        severity: 'error'
      });
    }
  };

  const filteredSongs = songs.filter(song =>
    song.artist.toLowerCase().includes(artistFilter.toLowerCase())
  );

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" gutterBottom>
            Şarkı Listesi
          </Typography>
          
          <Box>
            {selectedSongs.length > 0 && (
              <>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<LabelIcon />}
                  onClick={() => setOpenTagDialog(true)}
                  sx={{ mr: 2 }}
                >
                  Tag Güncelle ({selectedSongs.length})
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => setOpenDialog(true)}
                >
                  Seçilenleri Sil ({selectedSongs.length})
                </Button>
              </>
            )}
          </Box>
        </Box>
        
        <TextField
          label="Sanatçıya Göre Filtrele"
          variant="outlined"
          fullWidth
          value={artistFilter}
          onChange={(e) => setArtistFilter(e.target.value)}
          sx={{ mb: 2 }}
        />

        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <DataGrid
            rows={filteredSongs}
            columns={columns}
            getRowId={(row) => row._id}
            initialState={{
              pagination: {
                paginationModel: {
                  pageSize: 10,
                },
              },
            }}
            pageSizeOptions={[10, 25, 50]}
            checkboxSelection
            disableRowSelectionOnClick
            autoHeight
            loading={loading}
            onRowSelectionModelChange={(newSelection) => {
              setSelectedSongs(newSelection);
            }}
          />
        </Paper>
      </Box>

      {/* Silme Dialog'u */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
      >
        <DialogTitle>Şarkıları Sil</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Seçili {selectedSongs.length} şarkıyı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>İptal</Button>
          <Button onClick={handleDeleteSelected} color="error" variant="contained">
            Sil
          </Button>
        </DialogActions>
      </Dialog>

      {/* Tag Güncelleme Dialog'u */}
      <Dialog
        open={openTagDialog}
        onClose={() => setOpenTagDialog(false)}
      >
        <DialogTitle>Tag Güncelle</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Seçili {selectedSongs.length} şarkının tag'ini güncelleyin.
          </DialogContentText>
          <FormControl fullWidth>
            <InputLabel>Tag</InputLabel>
            <Select
              value={selectedTag}
              label="Tag"
              onChange={(e) => setSelectedTag(e.target.value)}
            >
              {TAG_OPTIONS.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTagDialog(false)}>İptal</Button>
          <Button 
            onClick={handleUpdateTags} 
            color="primary" 
            variant="contained"
            disabled={!selectedTag}
          >
            Güncelle
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
