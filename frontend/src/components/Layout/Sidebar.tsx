// ─────────────────────────────────────────────────────────────────────────────
// Sidebar — 9 étapes
// ─────────────────────────────────────────────────────────────────────────────

import {
  Drawer, List, ListItem, ListItemButton,
  ListItemIcon, ListItemText, Toolbar, Divider,
  Button, Box, Typography, CircularProgress, Chip,
} from '@mui/material';
import {
  Dashboard, People, Extension, Calculate,
  Engineering, CalendarMonth, Timeline, Flight, Download, RestartAlt,
} from '@mui/icons-material';

// ── 9 steps ───────────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Informations Projet', icon: <Dashboard /> },
  { id: 2, label: 'Segments',            icon: <People /> },
  { id: 3, label: 'Modules',             icon: <Extension /> },
  { id: 4, label: 'Estimations',         icon: <Calculate /> },
  { id: 5, label: 'Ressources',          icon: <Engineering /> },
  { id: 6, label: 'Planning',            icon: <CalendarMonth /> },
  { id: 7, label: 'Gantt',               icon: <Timeline /> },
  { id: 8, label: 'Voyages',             icon: <Flight /> },
  { id: 9, label: 'Génération',          icon: <Download /> },
];

interface SidebarProps {
  currentStep: number;
  onStepChange: (step: number) => void;
  onReset: () => void;
  isResetting?: boolean;
  completedSteps?: number[];
}

export default function Sidebar({
  currentStep, onStepChange, onReset, isResetting, completedSteps = [],
}: SidebarProps) {
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 260,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 260,
          boxSizing: 'border-box',
          bgcolor: '#1a1a2e',
          color: 'white',
        },
      }}
    >
      <Toolbar sx={{ minHeight: '64px !important' }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'white' }}>
          <span style={{ fontSize: '1.75rem' }}>🧠</span> AI Planning
        </Typography>
      </Toolbar>

      <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />

      <List sx={{ flex: 1, overflow: 'auto', py: 1 }}>
        {STEPS.map((step) => {
          const isActive    = currentStep === step.id;
          const isCompleted = completedSteps.includes(step.id);

          return (
            <ListItem key={step.id} disablePadding>
              <ListItemButton
                selected={isActive}
                onClick={() => onStepChange(step.id)}
                sx={{
                  py: 1.25, px: 2,
                  '&.Mui-selected': {
                    bgcolor: 'rgba(25, 118, 210, 0.25)',
                    borderRight: '3px solid #1976d2',
                  },
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
                }}
              >
                <ListItemIcon sx={{
                  color: isActive ? '#1976d2' : isCompleted ? '#4CAF50' : 'rgba(255,255,255,0.55)',
                  minWidth: 36,
                }}>
                  {step.icon}
                </ListItemIcon>

                <ListItemText
                  primary={step.label}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 700 : 400,
                    color: isActive ? 'white' : 'rgba(255,255,255,0.7)',
                  }}
                />

                {/* Step number badge */}
                <Chip
                  label={step.id}
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: 10,
                    bgcolor: isActive
                      ? '#1976d2'
                      : isCompleted
                        ? '#4CAF50'
                        : 'rgba(255,255,255,0.1)',
                    color: 'white',
                    '& .MuiChip-label': { px: 0.75 },
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />

      {/* Progress indicator */}
      <Box sx={{ px: 2, py: 1 }}>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
          Étape {currentStep} sur {STEPS.length}
        </Typography>
        <Box sx={{
          mt: 0.5, height: 3, borderRadius: 2,
          bgcolor: 'rgba(255,255,255,0.1)',
          overflow: 'hidden',
        }}>
          <Box sx={{
            height: '100%', borderRadius: 2,
            bgcolor: '#1976d2',
            width: `${(currentStep / STEPS.length) * 100}%`,
            transition: 'width .3s',
          }} />
        </Box>
      </Box>

      <Box sx={{ p: 2 }}>
        <Button
          fullWidth variant="outlined" color="error"
          startIcon={isResetting
            ? <CircularProgress size={16} color="error" />
            : <RestartAlt />}
          onClick={onReset}
          disabled={isResetting}
          sx={{
            borderColor: 'rgba(255,255,255,0.2)',
            color: 'rgba(255,255,255,0.7)',
            '&:hover': {
              borderColor: '#f44336',
              bgcolor: 'rgba(244, 67, 54, 0.1)',
              color: 'white',
            },
          }}
        >
          {isResetting ? 'Réinitialisation…' : 'Réinitialiser'}
        </Button>
      </Box>
    </Drawer>
  );
}