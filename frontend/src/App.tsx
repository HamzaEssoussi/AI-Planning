import { useEffect, useRef, useState } from 'react';
import {
  Box, Container, Toolbar, Card, CardContent, Grid, TextField,
  Select, MenuItem, FormControl, FormGroup, FormControlLabel,
  InputLabel, Button, Alert, Typography, Slider, IconButton,
  Checkbox, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, CircularProgress, Divider, Accordion, AccordionSummary,
  AccordionDetails, Tabs, Tab, Tooltip,
} from '@mui/material';
import {
  ExpandMore, ArrowForward, ArrowBack,
  Download as DownloadIcon, Settings, Add, Delete, PlayArrow, Refresh,
} from '@mui/icons-material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer,
} from 'recharts';
import Sidebar from './components/Layout/Sidebar';
import {
  useWizardState, useWizardStep, useResetWizard,
  useCalculateEstimation, useExport, usePlanningCalculate,
} from './hooks/useWizard';
import WbsTree from './components/WbsTree';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const SEGMENTS_LABELS: Record<string, string> = {
  retail: 'Retail', sme: 'SME', corporate: 'Corporate', fi: 'FI',
};

const MODULES_LABELS: Record<string, string> = {
  kyc_boarding: 'KYC & Onboarding',
  loan_origination: 'Loan Origination',
  scoring: 'Scoring',
  underwriting_approval: 'Underwriting & Approval',
  limit_management: 'Limit Management',
  collateral_management: 'Collateral Management',
  loan_servicing: 'Loan Servicing',
  collection_provisioning: 'Collection & Provisioning',
  early_warning: 'Early Warning System',
  ai_lending: 'AI-Powered Lending',
  omnichannel: 'Omnichannel',
  bi_reporting: 'BI & Reporting',
};

const MODULE_SEGMENT_MAPPING: Record<string, string[]> = {
  kyc_boarding: ['retail', 'sme', 'corporate', 'fi'],
  loan_origination: ['retail', 'sme', 'corporate', 'fi'],
  scoring: ['retail', 'sme', 'corporate', 'fi'],
  underwriting_approval: ['retail', 'sme', 'corporate', 'fi'],
  limit_management: ['retail', 'sme', 'corporate', 'fi'],
  collateral_management: ['retail', 'sme', 'corporate', 'fi'],
  loan_servicing: ['retail', 'sme', 'corporate', 'fi'],
  collection_provisioning: ['retail', 'sme', 'corporate', 'fi'],
  early_warning: ['retail', 'sme', 'corporate', 'fi'],
  ai_lending: ['retail', 'sme', 'corporate'],
  omnichannel: ['retail', 'sme'],
  bi_reporting: ['retail', 'sme', 'corporate', 'fi'],
};

const COMPONENTS = [
  { key: 'workflow',    label: 'Workflow' },
  { key: 'document',   label: 'Document' },
  { key: 'interface',  label: 'Interface' },
  { key: 'report',     label: 'Report' },
  { key: 'alert',      label: 'Alerte' },
  { key: 'bi_dashboard', label: 'Dashboard BI' },
  { key: 'ocr',        label: 'OCR' },
  { key: 'ai_writeups', label: 'AI Writeups' },
];

const DEFAULT_COEFF_TABLE = [
  { component: 'workflow',     low: 3,   medium: 5,  high: 8  },
  { component: 'document',     low: 1,   medium: 2,  high: 3  },
  { component: 'interface',    low: 2,   medium: 4,  high: 7  },
  { component: 'report',       low: 1,   medium: 2,  high: 4  },
  { component: 'alert',        low: 0.5, medium: 1,  high: 2  },
  { component: 'bi_dashboard', low: 2,   medium: 4,  high: 6  },
  { component: 'ocr',          low: 2,   medium: 5,  high: 9  },
  { component: 'ai_writeups',  low: 3,   medium: 6,  high: 10 },
];

type Complexity = 'low' | 'medium' | 'high';
type CoeffRow = { component: string; low: number; medium: number; high: number };

const ROLE_LABELS: Record<string, string> = {
  project_manager:        'Chef de Projet',
  functional_consultant:  'Consultant Fonctionnel',
  integration_consultant: 'Consultant Intégration',
  qa_tester:              'QA / Testeur',
  devops:                 'DevOps',
  data_bi_engineer:       'Data/BI Engineer',
  ai_engineer:            'AI Engineer',
};

const DEFAULT_ROLE_DISTRIBUTION: Record<string, number> = {
  project_manager: 0.10, functional_consultant: 0.25,
  integration_consultant: 0.20, qa_tester: 0.15,
  devops: 0.10, data_bi_engineer: 0.10, ai_engineer: 0.10,
};

const PHASES = [
  { key: 'prescoping', label: 'Pré-cadrage',       color: '#5DADE2' },
  { key: 'scoping',    label: 'Cadrage',            color: '#2E86C1' },
  { key: 'build',      label: 'Développement',      color: '#1F4E79' },
  { key: 'testing',    label: 'Tests',              color: '#148F77' },
  { key: 'go_live',    label: 'Mise en Production', color: '#1E8449' },
  { key: 'support',    label: 'Support',            color: '#D4AC0D' },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];
const COMPLEXITY_COLOR: Record<Complexity, 'success' | 'warning' | 'error'> = {
  low: 'success', medium: 'warning', high: 'error',
};
const COMPLEXITY_LABEL: Record<Complexity, string> = {
  low: 'Faible', medium: 'Moyenne', high: 'Élevée',
};

// Planning task type (saisie manuelle)
interface Task {
  id: string; name: string; duration_days: number;
  onsite_resources: number; remote_resources: number;
  dependencies: string[]; notes: string;
}
type PlanGrid = Record<string, Task[]>;

function makeCellKey(seg: string, mod: string, ph: string) { return `${seg}::${mod}::${ph}`; }
function makeTask(o: Partial<Task> = {}): Task {
  return {
    id: `T${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
    name: '', duration_days: 1, onsite_resources: 0,
    remote_resources: 0, dependencies: [], notes: '', ...o,
  };
}

function phaseLabel(key: string) { return PHASES.find(p => p.key === key)?.label || key; }
function phaseColor(key: string) { return PHASES.find(p => p.key === key)?.color || '#888'; }

// ═══════════════════════════════════════════════════════════════
// STEP 1 — Project Info
// ═══════════════════════════════════════════════════════════════
function Step1({ onNext, state }: { onNext: () => void; state: any }) {
  const [info, setInfo] = useState(() => state?.project_info || {
    client_name: '', region: '', currency: 'EUR', project_title: '',
    prepared_by: '', start_date: new Date().toISOString().split('T')[0],
  });
  const mutation = useWizardStep(1);
  const update = (f: string, v: string) => setInfo({ ...info, [f]: v });
  const handleSave = async () => {
    if (!info.client_name || !info.project_title || !info.prepared_by) return;
    await mutation.mutateAsync(info); onNext();
  };
  return (
    <Card><CardContent>
      <Typography variant="h5" gutterBottom>Informations du Projet</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}><TextField label="Client" value={info.client_name} onChange={e => update('client_name', e.target.value)} fullWidth required /></Grid>
        <Grid item xs={12} md={6}><TextField label="Titre du projet" value={info.project_title} onChange={e => update('project_title', e.target.value)} fullWidth required /></Grid>
        <Grid item xs={12} md={4}><TextField label="Région" value={info.region} onChange={e => update('region', e.target.value)} fullWidth /></Grid>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth><InputLabel>Devise</InputLabel>
            <Select value={info.currency} onChange={e => update('currency', e.target.value)}>
              <MenuItem value="EUR">EUR</MenuItem><MenuItem value="USD">USD</MenuItem><MenuItem value="MAD">MAD</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={4}><TextField label="Préparé par" value={info.prepared_by} onChange={e => update('prepared_by', e.target.value)} fullWidth required /></Grid>
        <Grid item xs={12} md={6}><TextField label="Date de début" type="date" value={info.start_date || ''} onChange={e => update('start_date', e.target.value)} fullWidth InputLabelProps={{ shrink: true }} /></Grid>
        <Grid item xs={12} md={6}><TextField label="Sous-titre / Objet" value={info.project_subtitle || ''} onChange={e => update('project_subtitle', e.target.value)} fullWidth /></Grid>
        <Grid item xs={12}><TextField label="Notes" value={info.notes || ''} onChange={e => update('notes', e.target.value)} fullWidth multiline rows={2} /></Grid>
      </Grid>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Button variant="contained" endIcon={<ArrowForward />} onClick={handleSave}
          disabled={!info.client_name || !info.project_title || !info.prepared_by || mutation.isPending}>
          {mutation.isPending ? 'Sauvegarde...' : 'Sauvegarder et continuer'}
        </Button>
      </Box>
    </CardContent></Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// STEP 2 — Segments
// ═══════════════════════════════════════════════════════════════
function Step2({ onNext, onPrevious, state }: { onNext: () => void; onPrevious: () => void; state: any }) {
  const [segments, setSegments] = useState<string[]>(state?.segments?.segments || []);
  const mutation = useWizardStep(2);
  const handleSave = async () => {
    if (!segments.length) return;
    await mutation.mutateAsync({ segments }); onNext();
  };
  return (
    <Card><CardContent>
      <Typography variant="h5" gutterBottom>Segments Cibles</Typography>
      <FormControl fullWidth>
        <InputLabel>Segments</InputLabel>
        <Select multiple value={segments}
          onChange={e => setSegments(typeof e.target.value === 'string' ? [] : e.target.value as string[])}
          renderValue={sel => <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {(sel as string[]).map(v => <Chip key={v} label={SEGMENTS_LABELS[v]} />)}
          </Box>}>
          {Object.entries(SEGMENTS_LABELS).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
        </Select>
      </FormControl>
      {!segments.length && <Alert severity="warning" sx={{ mt: 2 }}>Sélectionnez au moins un segment</Alert>}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button variant="outlined" startIcon={<ArrowBack />} onClick={onPrevious}>Précédent</Button>
        <Button variant="contained" endIcon={<ArrowForward />} onClick={handleSave} disabled={!segments.length || mutation.isPending}>
          {mutation.isPending ? 'Sauvegarde...' : 'Sauvegarder et continuer'}
        </Button>
      </Box>
    </CardContent></Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// STEP 3 — Modules
// ═══════════════════════════════════════════════════════════════
function Step3({ onNext, onPrevious, state }: { onNext: () => void; onPrevious: () => void; state: any }) {
  const segments: string[] = state?.segments?.segments || [];
  const existing = state?.modules?.segments_modules || {};
  const [sel, setSel] = useState<Record<string, string[]>>(() => {
    const init: Record<string, string[]> = {};
    segments.forEach(s => { init[s] = existing[s] || []; });
    return init;
  });
  const avail = Object.keys(MODULES_LABELS).filter(m => MODULE_SEGMENT_MAPPING[m].some(s => segments.includes(s)));
  const mutation = useWizardStep(3);
  const toggle = (seg: string, mod: string) => setSel(prev => {
    const cur = prev[seg] || [];
    return { ...prev, [seg]: cur.includes(mod) ? cur.filter(m => m !== mod) : [...cur, mod] };
  });
  const handleSave = async () => {
    const cleaned: Record<string, string[]> = {};
    segments.forEach(s => { cleaned[s] = (sel[s] || []).filter(m => MODULE_SEGMENT_MAPPING[m].includes(s)); });
    if (!Object.values(cleaned).flat().length) return;
    await mutation.mutateAsync({ segments_modules: cleaned }); onNext();
  };
  return (
    <Card><CardContent>
      <Typography variant="h5" gutterBottom>Modules par segment</Typography>
      {!segments.length ? <Alert severity="warning">Sélectionnez d'abord des segments</Alert> : (
        segments.map(seg => (
          <Card key={seg} variant="outlined" sx={{ mb: 2, p: 2 }}>
            <Typography fontWeight="bold" gutterBottom>{SEGMENTS_LABELS[seg]}</Typography>
            <FormGroup>
              {avail.filter(m => MODULE_SEGMENT_MAPPING[m].includes(seg)).map(m => (
                <FormControlLabel key={m}
                  control={<Checkbox checked={(sel[seg] || []).includes(m)} onChange={() => toggle(seg, m)} />}
                  label={MODULES_LABELS[m]} />
              ))}
            </FormGroup>
          </Card>
        ))
      )}
      {!Object.values(sel).flat().length && !!segments.length && (
        <Alert severity="warning" sx={{ mt: 2 }}>Sélectionnez au moins un module</Alert>
      )}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button variant="outlined" startIcon={<ArrowBack />} onClick={onPrevious}>Précédent</Button>
        <Button variant="contained" endIcon={<ArrowForward />} onClick={handleSave}
          disabled={!Object.values(sel).flat().length || mutation.isPending}>
          {mutation.isPending ? 'Sauvegarde...' : 'Sauvegarder et continuer'}
        </Button>
      </Box>
    </CardContent></Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// STEP 4 — Estimations
// ═══════════════════════════════════════════════════════════════
function Step4({ onNext, onPrevious, state }: { onNext: () => void; onPrevious: () => void; state: any }) {
  const segments: string[] = state?.segments?.segments || [];
  const segmentsModules: Record<string, string[]> = state?.modules?.segments_modules || {};
  const [coeffTable, setCoeffTable] = useState<CoeffRow[]>(() => {
    if (state?.component_coefficients)
      return Object.entries(state.component_coefficients as Record<string, Record<Complexity, number>>)
        .map(([component, values]) => ({ component, low: values.low, medium: values.medium, high: values.high }));
    return DEFAULT_COEFF_TABLE;
  });
  const [coeffOpen, setCoeffOpen] = useState(false);
  const [grid, setGrid] = useState<Record<string, { quantity: number; complexity: Complexity }>>(() => {
    const init: Record<string, { quantity: number; complexity: Complexity }> = {};
    (state?.estimations || []).forEach((est: any) => {
      (est.components || []).forEach((c: any) => {
        if (c.quantity > 0) init[`${est.segment || ''}::${est.module}::${c.component}`] = { quantity: c.quantity, complexity: c.complexity || 'medium' };
      });
    });
    return init;
  });
  const [activeSeg, setActiveSeg] = useState(segments[0] || '');
  const mutation = useWizardStep(4);

  const coeffMap = Object.fromEntries(coeffTable.map(r => [r.component, r]));
  const effort = (cell: any, coeff: CoeffRow | undefined) => (!cell || !coeff || cell.quantity <= 0) ? 0 : cell.quantity * coeff[cell.complexity as Complexity];
  const modEffort = (seg: string, mod: string) => COMPONENTS.reduce((s, c) => s + effort(grid[`${seg}::${mod}::${c.key}`], coeffMap[c.key]), 0);
  const segEffort = (seg: string) => (segmentsModules[seg] || []).reduce((s, m) => s + modEffort(seg, m), 0);
  const totalEffort = () => segments.reduce((s, seg) => s + segEffort(seg), 0);
  const updateCell = (seg: string, mod: string, comp: string, field: string, value: any) => {
    const k = `${seg}::${mod}::${comp}`;
    setGrid(prev => ({ ...prev, [k]: { quantity: field === 'quantity' ? Math.max(0, Number(value)) : (prev[k]?.quantity ?? 0), complexity: field === 'complexity' ? value : (prev[k]?.complexity ?? 'medium') } }));
  };
  const handleSave = async () => {
    const byKey: Record<string, any> = {};
    Object.entries(grid).forEach(([k, cell]) => {
      if (cell.quantity <= 0) return;
      const [seg, mod, comp] = k.split('::');
      const key = `${seg}::${mod}`;
      if (!byKey[key]) byKey[key] = { segment: seg, module: mod, components: [] };
      byKey[key].components.push({ component: comp, quantity: cell.quantity, complexity: cell.complexity });
    });
    if (!Object.keys(byKey).length) return;
    const coeffPay = coeffTable.reduce((a: any, c) => { a[c.component] = { low: c.low, medium: c.medium, high: c.high }; return a; }, {});
    await mutation.mutateAsync({ estimations: Object.values(byKey), component_coefficients: coeffPay }); onNext();
  };
  const hasEntries = Object.values(grid).some(c => c.quantity > 0);
  if (!segments.length) return <Alert severity="warning">Sélectionnez d'abord des segments.</Alert>;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">Estimations</Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Paper elevation={0} sx={{ px: 2.5, py: 1, bgcolor: '#1F4E79', color: 'white', borderRadius: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>Effort total</Typography>
            <Typography variant="h6" fontWeight="bold">{totalEffort().toFixed(1)} JH</Typography>
          </Paper>
          <Button variant="outlined" startIcon={<Settings />} onClick={() => setCoeffOpen(true)} size="small">Coefficients</Button>
        </Box>
      </Box>
      <Card sx={{ mb: 2 }}>
        <Tabs value={activeSeg} onChange={(_, v) => setActiveSeg(v)} variant="scrollable" scrollButtons="auto" sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 2 }}>
          {segments.map(seg => {
            const eff = segEffort(seg);
            return <Tab key={seg} value={seg} label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><span>{SEGMENTS_LABELS[seg]}</span>{eff > 0 && <Chip label={`${eff.toFixed(0)} JH`} size="small" color="primary" sx={{ height: 20, fontSize: 11 }} />}</Box>} />;
          })}
        </Tabs>
        <CardContent>
          {!(segmentsModules[activeSeg] || []).length ? <Alert severity="info">Aucun module pour ce segment.</Alert> : (
            (segmentsModules[activeSeg] || []).map(mod => {
              const mEff = modEffort(activeSeg, mod);
              return (
                <Accordion key={mod} defaultExpanded sx={{ mb: 1 }}>
                  <AccordionSummary expandIcon={<ExpandMore />} sx={{ bgcolor: '#EBF5FB', '& .MuiAccordionSummary-content': { alignItems: 'center', gap: 2 } }}>
                    <Typography fontWeight="bold">{MODULES_LABELS[mod]}</Typography>
                    {mEff > 0 && <Chip label={`${mEff.toFixed(1)} JH`} size="small" color="primary" sx={{ height: 22 }} />}
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 0 }}>
                    <TableContainer><Table size="small">
                      <TableHead><TableRow sx={{ bgcolor: '#F7FAFC' }}>
                        <TableCell sx={{ fontWeight: 600, width: 160 }}>Composant</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600, width: 100 }}>Quantité</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600, width: 160 }}>Complexité</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600, width: 80 }}><Tooltip title="Effort = Quantité × Coefficient"><span>JH ⓘ</span></Tooltip></TableCell>
                      </TableRow></TableHead>
                      <TableBody>
                        {COMPONENTS.map((comp, ci) => {
                          const k = `${activeSeg}::${mod}::${comp.key}`;
                          const cell = grid[k]; const qty = cell?.quantity ?? 0;
                          const complexity: Complexity = cell?.complexity ?? 'medium';
                          const eff = effort(cell, coeffMap[comp.key]);
                          return (
                            <TableRow key={comp.key} sx={{ bgcolor: qty > 0 ? '#F0F8FF' : ci % 2 === 0 ? 'white' : '#FAFAFA' }}>
                              <TableCell><Typography variant="body2" fontWeight={qty > 0 ? 600 : 400}>{comp.label}</Typography></TableCell>
                              <TableCell align="center">
                                <TextField type="number" size="small" value={qty === 0 ? '' : qty} placeholder="0"
                                  onChange={e => updateCell(activeSeg, mod, comp.key, 'quantity', e.target.value)}
                                  inputProps={{ min: 0, style: { textAlign: 'center', width: 64 } }}
                                  sx={{ '& fieldset': { borderColor: qty > 0 ? '#1976d2' : undefined } }} />
                              </TableCell>
                              <TableCell align="center">
                                <FormControl size="small" sx={{ minWidth: 120 }}>
                                  <Select value={complexity} onChange={e => updateCell(activeSeg, mod, comp.key, 'complexity', e.target.value)} disabled={qty === 0} sx={{ opacity: qty === 0 ? 0.4 : 1 }}>
                                    {(['low', 'medium', 'high'] as Complexity[]).map(c => (
                                      <MenuItem key={c} value={c}><Chip label={COMPLEXITY_LABEL[c]} color={COMPLEXITY_COLOR[c]} size="small" sx={{ cursor: 'pointer', fontSize: 11, height: 20 }} /></MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              </TableCell>
                              <TableCell align="center">
                                {eff > 0 ? <Chip label={eff.toFixed(1)} size="small" color="primary" sx={{ fontWeight: 700 }} /> : <Typography variant="body2" color="text.disabled">—</Typography>}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        {mEff > 0 && (
                          <TableRow sx={{ bgcolor: '#E8F4FD' }}>
                            <TableCell colSpan={3} sx={{ fontWeight: 700, fontSize: 13, pl: 2 }}>Total {MODULES_LABELS[mod]}</TableCell>
                            <TableCell align="center"><Chip label={`${mEff.toFixed(1)} JH`} color="primary" size="small" sx={{ fontWeight: 800 }} /></TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table></TableContainer>
                  </AccordionDetails>
                </Accordion>
              );
            })
          )}
          {segEffort(activeSeg) > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1, pr: 1 }}>
              <Paper elevation={0} sx={{ px: 2, py: 0.75, bgcolor: '#D6EAF8', borderRadius: 1, display: 'flex', gap: 1, alignItems: 'center' }}>
                <Typography variant="body2" color="primary" fontWeight={600}>Total {SEGMENTS_LABELS[activeSeg]}</Typography>
                <Typography variant="body1" color="primary" fontWeight={800}>{segEffort(activeSeg).toFixed(1)} JH</Typography>
              </Paper>
            </Box>
          )}
        </CardContent>
      </Card>
      {!hasEntries && <Alert severity="warning" sx={{ mb: 2 }}>Renseignez au moins une quantité.</Alert>}
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button variant="outlined" startIcon={<ArrowBack />} onClick={onPrevious}>Précédent</Button>
        <Button variant="contained" endIcon={<ArrowForward />} onClick={handleSave} disabled={!hasEntries || mutation.isPending}>
          {mutation.isPending ? 'Sauvegarde...' : 'Sauvegarder et continuer'}
        </Button>
      </Box>
      {/* Coefficient dialog */}
      <Dialog open={coeffOpen} onClose={() => setCoeffOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Settings fontSize="small" /> Coefficients de complexité</DialogTitle>
        <DialogContent dividers>
          <TableContainer><Table size="small">
            <TableHead><TableRow sx={{ bgcolor: '#F7FAFC' }}>
              <TableCell sx={{ fontWeight: 600 }}>Composant</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600, color: '#2E7D32' }}>Faible</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600, color: '#E65100' }}>Moyenne</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600, color: '#C62828' }}>Élevée</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {coeffTable.map((row, idx) => (
                <TableRow key={row.component}>
                  <TableCell><Typography variant="body2" fontWeight={500}>{COMPONENTS.find(c => c.key === row.component)?.label}</Typography></TableCell>
                  {(['low', 'medium', 'high'] as const).map(lvl => (
                    <TableCell key={lvl} align="center">
                      <TextField type="number" size="small" value={row[lvl]}
                        onChange={e => { const u = [...coeffTable]; u[idx] = { ...u[idx], [lvl]: parseFloat(e.target.value) || 0 }; setCoeffTable(u); }}
                        inputProps={{ min: 0, step: 0.5, style: { textAlign: 'center', width: 60 } }} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table></TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCoeffTable(DEFAULT_COEFF_TABLE)} color="warning">Réinitialiser</Button>
          <Button onClick={() => setCoeffOpen(false)} variant="contained">Fermer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ═══════════════════════════════════════════════════════════════
// STEP 5 — Resources
// ═══════════════════════════════════════════════════════════════
function Step5({ onNext, onPrevious, state }: { onNext: () => void; onPrevious: () => void; state: any }) {
  const computeTotalJH = (s: any) => {
    if (!s?.estimations) return 0;
    let t = 0;
    s.estimations.forEach((est: any) => (est.components || []).forEach((c: any) => { t += c.quantity * ({ low: 1, medium: 2, high: 3 }[c.complexity as string] || 1); }));
    return t;
  };
  const totalJH = computeTotalJH(state);
  const cur = state?.project_info?.currency || '';
  const [distribution, setDistribution] = useState<Record<string, number>>(() => state?.role_distribution || { ...DEFAULT_ROLE_DISTRIBUTION });
  const [distOpen, setDistOpen] = useState(false);
  const [cfg, setCfg] = useState<Record<string, any>>(() => {
    const existingMap: Record<string, any> = {};
    (state?.resources || []).forEach((r: any) => { existingMap[r.role] = r; });
    const init: Record<string, any> = {};
    Object.keys(ROLE_LABELS).forEach(role => {
      const ex = existingMap[role];
      init[role] = { included: !!ex, count: ex?.count ?? 1, daily_rate: ex?.daily_rate ?? 500, allocation: ex?.allocation ?? 0.8, profile: ex?.profile ?? 'senior' };
    });
    return init;
  });
  const mutation = useWizardStep(5);
  const jhFor = (role: string) => totalJH * (distribution[role] ?? 0);
  const costFor = (role: string) => jhFor(role) * cfg[role].daily_rate * cfg[role].allocation;
  const totalCost = Object.keys(cfg).reduce((s, r) => s + (cfg[r].included ? costFor(r) : 0), 0);
  const anySelected = Object.values(cfg).some(c => c.included);
  const distSum = Object.values(distribution).reduce((a, b) => a + b, 0);
  const update = (role: string, field: string, value: any) => setCfg(prev => ({ ...prev, [role]: { ...prev[role], [field]: value } }));
  const handleSave = async () => {
    const resources = Object.entries(cfg).filter(([, c]) => c.included).map(([role, c]) => ({ role, count: c.count, daily_rate: c.daily_rate, allocation: c.allocation, profile: c.profile }));
    if (!resources.length) return;
    await mutation.mutateAsync({ resources, role_distribution: distribution }); onNext();
  };
  return (
    <Box>
      <Card sx={{ mb: 2 }}><CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h5">Ressources</Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Paper elevation={0} sx={{ px: 2.5, py: 1, bgcolor: '#1F4E79', color: 'white', borderRadius: 2 }}>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>Coût total</Typography>
              <Typography variant="h6" fontWeight="bold">{totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })} {cur}</Typography>
            </Paper>
            <Button variant="outlined" startIcon={<Settings />} onClick={() => setDistOpen(true)} size="small">Répartition</Button>
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary">Effort total : <strong>{totalJH.toFixed(1)} JH</strong></Typography>
        {!anySelected && <Alert severity="warning" sx={{ mt: 2 }}>Sélectionnez au moins un rôle.</Alert>}
        <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
          <Table size="small">
            <TableHead><TableRow sx={{ bgcolor: '#F7FAFC' }}>
              <TableCell padding="checkbox" />
              <TableCell sx={{ fontWeight: 600 }}>Rôle</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600 }}>JH</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600, width: 90 }}>Nombre</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600, width: 110 }}>TJM</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600, width: 160 }}>Allocation</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600, width: 130 }}>Profil</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600 }}>Coût</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {Object.keys(ROLE_LABELS).map(role => {
                const rc = cfg[role]; const jh = jhFor(role); const cost = rc.included ? costFor(role) : 0;
                return (
                  <TableRow key={role} sx={{ bgcolor: rc.included ? '#F0F8FF' : 'white', opacity: rc.included ? 1 : 0.55 }}>
                    <TableCell padding="checkbox"><Checkbox checked={rc.included} onChange={() => setCfg(prev => ({ ...prev, [role]: { ...prev[role], included: !prev[role].included } }))} /></TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={rc.included ? 600 : 400}>{ROLE_LABELS[role]}</Typography>
                      <Typography variant="caption" color="text.secondary">{Math.round((distribution[role] ?? 0) * 100)}% de l'effort</Typography>
                    </TableCell>
                    <TableCell align="center">{jh.toFixed(1)}</TableCell>
                    <TableCell align="center"><TextField type="number" size="small" value={rc.count} disabled={!rc.included} onChange={e => update(role, 'count', Math.max(0, parseInt(e.target.value) || 0))} inputProps={{ min: 0, style: { textAlign: 'center', width: 50 } }} /></TableCell>
                    <TableCell align="center"><TextField type="number" size="small" value={rc.daily_rate} disabled={!rc.included} onChange={e => update(role, 'daily_rate', parseFloat(e.target.value) || 0)} inputProps={{ min: 0, style: { textAlign: 'center', width: 70 } }} /></TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Slider value={rc.allocation} min={0} max={1} step={0.1} disabled={!rc.included} onChange={(_, v) => update(role, 'allocation', v)} sx={{ width: 80 }} />
                        <Typography variant="caption">{Math.round(rc.allocation * 100)}%</Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <FormControl size="small" sx={{ minWidth: 100 }} disabled={!rc.included}>
                        <Select value={rc.profile} onChange={e => update(role, 'profile', e.target.value)}>
                          <MenuItem value="senior">Senior</MenuItem><MenuItem value="medior">Medior</MenuItem><MenuItem value="junior">Junior</MenuItem>
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell align="center">
                      {rc.included ? <Chip label={`${cost.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${cur}`} color="primary" size="small" sx={{ fontWeight: 700 }} /> : <Typography variant="body2" color="text.disabled">—</Typography>}
                    </TableCell>
                  </TableRow>
                );
              })}
              <TableRow sx={{ bgcolor: '#E8F4FD' }}>
                <TableCell colSpan={7} sx={{ fontWeight: 700, fontSize: 13, pl: 2 }}>Total</TableCell>
                <TableCell align="center"><Chip label={`${totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${cur}`} color="primary" size="small" sx={{ fontWeight: 800 }} /></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button variant="outlined" startIcon={<ArrowBack />} onClick={onPrevious}>Précédent</Button>
          <Button variant="contained" endIcon={<ArrowForward />} onClick={handleSave} disabled={!anySelected || mutation.isPending}>
            {mutation.isPending ? 'Sauvegarde...' : 'Sauvegarder et continuer'}
          </Button>
        </Box>
      </CardContent></Card>
      <Dialog open={distOpen} onClose={() => setDistOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Settings fontSize="small" /> Répartition de l'effort</DialogTitle>
        <DialogContent dividers>
          {(distSum < 0.999 || distSum > 1.001) && <Alert severity="warning" sx={{ mb: 2 }}>Total : {Math.round(distSum * 100)}% (devrait être 100%)</Alert>}
          {Object.keys(ROLE_LABELS).map(role => (
            <Box key={role} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography variant="body2" sx={{ minWidth: 200 }}>{ROLE_LABELS[role]}</Typography>
              <TextField type="number" size="small" value={Math.round((distribution[role] ?? 0) * 100)}
                onChange={e => { const p = Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)); setDistribution(prev => ({ ...prev, [role]: p / 100 })); }}
                inputProps={{ min: 0, max: 100, style: { textAlign: 'center', width: 60 } }} />
              <Typography variant="body2" sx={{ ml: 1 }}>%</Typography>
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDistribution({ ...DEFAULT_ROLE_DISTRIBUTION })} color="warning">Réinitialiser</Button>
          <Button onClick={() => setDistOpen(false)} variant="contained">Fermer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ═══════════════════════════════════════════════════════════════
// STEP 6 — Planning  (Facteurs + Saisie tâches + Génération WBS complète)
// ═══════════════════════════════════════════════════════════════
function Step6({ onNext, onPrevious, state }: { onNext: () => void; onPrevious: () => void; state: any }) {
  const segments: string[] = state?.segments?.segments || [];
  const segmentsModules: Record<string, string[]> = state?.modules?.segments_modules || {};

  // ── Planning factors ────────────────────────────────────────
  const [margin, setMargin]       = useState(state?.margin_percentage || 30);
  const [risk, setRisk]           = useState(state?.risk_factor || 1.0);
  const [complexity, setComplexity] = useState(state?.complexity_factor || 1.0);
  const [aiBoost, setAiBoost]     = useState(state?.ai_boost_factor || 1.0);

  // ── Execution config ─────────────────────────────────────────
  const [mode, setMode]         = useState(state?.planning_config?.mode     || 'sequential');
  const [calendar, setCalendar] = useState(state?.planning_config?.calendar || 'standard');

  // ── Task grid ─────────────────────────────────────────────────
  const [grid, setGrid] = useState<PlanGrid>(() => {
    const init: PlanGrid = {};
    (state?.manual_planning || []).forEach((t: any) => {
      const k = makeCellKey(t.segment || '', t.module || '', t.phase || '');
      if (!init[k]) init[k] = [];
      init[k].push({ id: t.id || makeTask().id, name: t.name || '', duration_days: t.duration_days || 1, onsite_resources: t.onsite_resources || 0, remote_resources: t.remote_resources || 0, dependencies: t.dependencies || [], notes: t.notes || '' });
    });
    return init;
  });

  const [activeSeg, setActiveSeg] = useState(segments[0] || '');
  const [planResult, setPlanResult] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  const factorsMutation        = useWizardStep(6);
  const planningConfigMutation = useWizardStep(7);
  const planningMutation       = usePlanningCalculate();

  const getTasks = (seg: string, mod: string, ph: string) => grid[makeCellKey(seg, mod, ph)] || [];

  const addTask = (seg: string, mod: string, ph: string) => {
    const k = makeCellKey(seg, mod, ph);
    setGrid(prev => ({ ...prev, [k]: [...(prev[k] || []), makeTask()] }));
    setPlanResult(null);
  };
  const changeTask = (seg: string, mod: string, ph: string, id: string, field: keyof Task, value: any) => {
    const k = makeCellKey(seg, mod, ph);
    setGrid(prev => ({ ...prev, [k]: (prev[k] || []).map(t => t.id === id ? { ...t, [field]: value } : t) }));
    setPlanResult(null);
  };
  const deleteTask = (seg: string, mod: string, ph: string, id: string) => {
    const k = makeCellKey(seg, mod, ph);
    setGrid(prev => ({ ...prev, [k]: (prev[k] || []).filter(t => t.id !== id) }));
    setPlanResult(null);
  };

  const totalTasks = Object.values(grid).reduce((s, ts) => s + ts.filter(t => t.name.trim()).length, 0);
  const totalDays  = Object.values(grid).reduce((s, ts) => s + ts.reduce((ss, t) => ss + (t.name.trim() ? t.duration_days : 0), 0), 0);

  const segTaskCount = (seg: string) => (segmentsModules[seg] || []).reduce((s, mod) => s + PHASES.reduce((ss, ph) => ss + getTasks(seg, mod, ph.key).filter(t => t.name.trim()).length, 0), 0);
  const modTaskCount = (seg: string, mod: string) => PHASES.reduce((s, ph) => s + getTasks(seg, mod, ph.key).filter(t => t.name.trim()).length, 0);

  const flattenGrid = () => {
    const tasks: any[] = [];
    Object.entries(grid).forEach(([key, cells]) => {
      const [seg, mod, ph] = key.split('::');
      cells.filter(t => t.name.trim()).forEach(t => tasks.push({ id: t.id, phase: ph, name: t.name, segment: seg, module: mod, duration_days: t.duration_days, onsite_resources: t.onsite_resources, remote_resources: t.remote_resources, dependencies: t.dependencies, notes: t.notes, start_date: '', end_date: '', total_jh: 0 }));
    });
    return tasks;
  };

  const persistFactorsAndConfig = async (flat: any[]) => {
    await factorsMutation.mutateAsync({ margin_percentage: margin, risk_factor: risk, complexity_factor: complexity, ai_boost_factor: aiBoost });
    await planningConfigMutation.mutateAsync({ mode, calendar, manual_planning: flat });
  };

  const handleGenerate = async () => {
    setGenerating(true); setGenError(null);
    try {
      const flat = flattenGrid();
      await persistFactorsAndConfig(flat);
      const res = await planningMutation.mutateAsync({
        ...state,
        margin_percentage: margin, risk_factor: risk, complexity_factor: complexity, ai_boost_factor: aiBoost,
        planning_config: { mode, calendar, start_date: state?.project_info?.start_date || null },
        manual_planning: flat,
      });
      setPlanResult(res);
    } catch (e: any) {
      setGenError(e?.response?.data?.detail || "Erreur lors de la génération du planning");
      console.error(e);
    }
    setGenerating(false);
  };

  const handleSave = async () => {
    await persistFactorsAndConfig(flattenGrid());
    onNext();
  };

  if (!segments.length) return <Alert severity="warning">Sélectionnez d'abord des segments (étape 2).</Alert>;

  // Regroupe les tâches leaf du WBS généré par (segment, module) — on utilise les clés
  // brutes renvoyées par le backend (segment_key/module_key) pour un matching fiable,
  // indépendant du libellé affiché.
  const leafTasks: any[] = (planResult?.tasks || []).filter((t: any) => !t.is_phase);
  const wbsBySegMod: Record<string, any[]> = {};
  leafTasks.forEach(t => {
    const k = `${t.segment_key ?? ''}::${t.module_key ?? ''}`;
    if (!wbsBySegMod[k]) wbsBySegMod[k] = [];
    wbsBySegMod[k].push(t);
  });

  // Tous les couples (segment, module) attendus d'après les étapes Segments/Modules,
  // pour repérer ceux qui n'ont encore aucune tâche/phase générée.
  const allSegModPairs: { key: string; seg: string; mod: string }[] = [];
  segments.forEach(seg => {
    (segmentsModules[seg] || []).forEach(mod => {
      allSegModPairs.push({ key: `${seg}::${mod}`, seg, mod });
    });
  });
  const emptySegModPairs = planResult ? allSegModPairs.filter(p => !wbsBySegMod[p.key]?.length) : [];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">🗓️ Planning</Typography>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          {totalTasks > 0 && <>
            <Chip label={`${totalTasks} tâche${totalTasks > 1 ? 's' : ''}`} size="small" />
            <Chip label={`${totalDays.toFixed(0)} j`} size="small" />
          </>}
          <Button variant="contained" startIcon={generating ? <CircularProgress size={16} color="inherit" /> : <PlayArrow />}
            onClick={handleGenerate} disabled={generating || totalTasks === 0} size="small">
            {generating ? 'Calcul…' : 'Générer le planning WBS'}
          </Button>
        </Box>
      </Box>

      {/* ── Factors + Config ────────────────────────────────── */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>Facteurs & configuration</Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <Typography variant="body2">Marge : {margin}%</Typography>
              <Slider value={margin} min={0} max={60} step={5} onChange={(_, v) => { setMargin(v as number); setPlanResult(null); }} />
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2">Risque : {risk.toFixed(2)}</Typography>
              <Slider value={risk} min={0.8} max={2.0} step={0.05} onChange={(_, v) => { setRisk(v as number); setPlanResult(null); }} />
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2">Complexité : {complexity.toFixed(2)}</Typography>
              <Slider value={complexity} min={0.8} max={2.0} step={0.05} onChange={(_, v) => { setComplexity(v as number); setPlanResult(null); }} />
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2">AI Boost : {aiBoost.toFixed(2)}</Typography>
              <Slider value={aiBoost} min={0.5} max={1.0} step={0.05} onChange={(_, v) => { setAiBoost(v as number); setPlanResult(null); }} />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Mode d'exécution</InputLabel>
                <Select value={mode} onChange={e => { setMode(e.target.value); setPlanResult(null); }}>
                  <MenuItem value="sequential">🔗 Phasé (séquentiel)</MenuItem>
                  <MenuItem value="parallel">⚡ Combiné (parallèle)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Calendrier</InputLabel>
                <Select value={calendar} onChange={e => { setCalendar(e.target.value); setPlanResult(null); }}>
                  <MenuItem value="standard">📅 Standard (Grégorien)</MenuItem>
                  <MenuItem value="islamic">🌙 Islamique (Hijri)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary">
                Début : <strong>{state?.project_info?.start_date || 'Non défini'}</strong>
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* ── Segment tabs → Module → Phase → Tasks ───────────── */}
      <Card sx={{ mb: 2 }}>
        <Tabs value={activeSeg} onChange={(_, v) => setActiveSeg(v)} variant="scrollable" scrollButtons="auto" sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 2 }}>
          {segments.map(seg => {
            const count = segTaskCount(seg);
            return (
              <Tab key={seg} value={seg} label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <span>📁 {SEGMENTS_LABELS[seg]}</span>
                  {count > 0 && <Chip label={count} size="small" color="primary" sx={{ height: 18, fontSize: 11, '& .MuiChip-label': { px: 0.75 } }} />}
                </Box>
              } />
            );
          })}
        </Tabs>
        <CardContent>
          {!(segmentsModules[activeSeg] || []).length ? <Alert severity="info">Aucun module pour ce segment.</Alert> : (
            (segmentsModules[activeSeg] || []).map(mod => {
              const mc = modTaskCount(activeSeg, mod);
              return (
                <Accordion key={mod} defaultExpanded sx={{ mb: 1.5 }}>
                  <AccordionSummary expandIcon={<ExpandMore />} sx={{ bgcolor: '#EBF5FB', '& .MuiAccordionSummary-content': { alignItems: 'center', gap: 1.5 } }}>
                    <Typography fontWeight={700} sx={{ flexGrow: 1 }}>◆ {MODULES_LABELS[mod]}</Typography>
                    {mc > 0 && <Chip label={`${mc} tâche${mc > 1 ? 's' : ''}`} size="small" color="primary" sx={{ height: 22 }} />}
                  </AccordionSummary>
                  <AccordionDetails sx={{ pt: 2, pb: 1 }}>
                    {PHASES.map(phase => {
                      const tasks = getTasks(activeSeg, mod, phase.key);
                      const named = tasks.filter(t => t.name.trim());
                      return (
                        <Box key={phase.key} sx={{ mb: 2 }}>
                          {/* Phase header */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1, borderLeft: `4px solid ${phase.color}`, bgcolor: `${phase.color}18`, borderRadius: '0 6px 6px 0', mb: 1 }}>
                            <Typography variant="subtitle2" fontWeight={700} sx={{ color: phase.color, flexGrow: 1 }}>● {phase.label}</Typography>
                            {named.length > 0 && <Chip label={`${named.length} tâche${named.length > 1 ? 's' : ''}`} size="small" sx={{ bgcolor: phase.color, color: 'white', fontWeight: 600, height: 20, fontSize: 11 }} />}
                          </Box>
                          {/* Task rows */}
                          {tasks.length > 0 && (
                            <TableContainer component={Paper} variant="outlined" sx={{ mb: 1 }}>
                              <Table size="small">
                                <TableHead><TableRow sx={{ bgcolor: '#F7FAFC' }}>
                                  <TableCell sx={{ fontWeight: 600 }}>Tâche</TableCell>
                                  <TableCell align="center" sx={{ fontWeight: 600 }}>Durée (j)</TableCell>
                                  <TableCell align="center" sx={{ fontWeight: 600 }}>Sur site</TableCell>
                                  <TableCell align="center" sx={{ fontWeight: 600 }}>Distance</TableCell>
                                  <TableCell sx={{ fontWeight: 600 }}>Prédécesseurs</TableCell>
                                  <TableCell sx={{ fontWeight: 600 }}>Notes</TableCell>
                                  <TableCell />
                                </TableRow></TableHead>
                                <TableBody>
                                  {tasks.map(task => {
                                    const preds = tasks.filter(t => t.id !== task.id && t.name.trim());
                                    return (
                                      <TableRow key={task.id} sx={{ bgcolor: task.name ? '#F0F8FF' : 'white' }}>
                                        <TableCell sx={{ minWidth: 200 }}>
                                          <TextField size="small" fullWidth placeholder="Nom de la tâche" value={task.name}
                                            onChange={e => changeTask(activeSeg, mod, phase.key, task.id, 'name', e.target.value)}
                                            sx={{ '& fieldset': { borderColor: task.name ? '#1976d2' : undefined } }} />
                                        </TableCell>
                                        <TableCell align="center" sx={{ width: 100 }}>
                                          <TextField size="small" type="number" value={task.duration_days}
                                            onChange={e => changeTask(activeSeg, mod, phase.key, task.id, 'duration_days', Math.max(0.5, parseFloat(e.target.value) || 0.5))}
                                            inputProps={{ min: 0.5, step: 0.5, style: { textAlign: 'center', width: 64 } }} />
                                        </TableCell>
                                        <TableCell align="center" sx={{ width: 90 }}>
                                          <TextField size="small" type="number" value={task.onsite_resources}
                                            onChange={e => changeTask(activeSeg, mod, phase.key, task.id, 'onsite_resources', Math.max(0, parseInt(e.target.value) || 0))}
                                            inputProps={{ min: 0, style: { textAlign: 'center', width: 56 } }} />
                                        </TableCell>
                                        <TableCell align="center" sx={{ width: 90 }}>
                                          <TextField size="small" type="number" value={task.remote_resources}
                                            onChange={e => changeTask(activeSeg, mod, phase.key, task.id, 'remote_resources', Math.max(0, parseInt(e.target.value) || 0))}
                                            inputProps={{ min: 0, style: { textAlign: 'center', width: 56 } }} />
                                        </TableCell>
                                        <TableCell sx={{ minWidth: 160 }}>
                                          <FormControl size="small" fullWidth disabled={!preds.length}>
                                            <Select multiple value={task.dependencies}
                                              onChange={e => changeTask(activeSeg, mod, phase.key, task.id, 'dependencies', typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                                              renderValue={sel => (sel as string[]).map(id => tasks.find(t => t.id === id)?.name || id).join(', ')} displayEmpty>
                                              {preds.map(t => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
                                            </Select>
                                          </FormControl>
                                        </TableCell>
                                        <TableCell sx={{ minWidth: 140 }}>
                                          <TextField size="small" fullWidth placeholder="Notes…" value={task.notes}
                                            onChange={e => changeTask(activeSeg, mod, phase.key, task.id, 'notes', e.target.value)} />
                                        </TableCell>
                                        <TableCell align="center" sx={{ width: 48 }}>
                                          <IconButton size="small" color="error" onClick={() => deleteTask(activeSeg, mod, phase.key, task.id)}><Delete fontSize="small" /></IconButton>
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          )}
                          <Button size="small" startIcon={<Add />} variant="outlined"
                            onClick={() => addTask(activeSeg, mod, phase.key)}
                            sx={{ ml: 0.5, fontSize: 12, borderStyle: 'dashed' }}>
                            + {phase.label}
                          </Button>
                        </Box>
                      );
                    })}
                  </AccordionDetails>
                </Accordion>
              );
            })
          )}
        </CardContent>
      </Card>

      {genError && <Alert severity="error" sx={{ mb: 2 }}>{genError}</Alert>}

      {/* ✅ Planning result — WBS complet avec WbsTree */}
      {planResult && (
        <Card sx={{ mb: 2, border: '1px solid #1976d2' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" color="primary">✅ Planning WBS généré</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip label={`${planResult.total_duration_days} j`} size="small" color="default" />
                <Chip label={`${planResult.total_jh?.toFixed(1)} JH`} size="small" color="primary" />
                <Chip label={`${leafTasks.length} tâches`} size="small" color="default" />
              </Box>
            </Box>

            {/* ✅ WBS hiérarchique professionnel */}
            <WbsTree
              tasks={leafTasks}
              projectName={state?.project_info?.project_title || 'Projet'}
            />

            {/* Modules sans tâches */}
            {emptySegModPairs.length > 0 && (
              <Box sx={{ mt: 2 }}>
                {emptySegModPairs.map(({ key, seg, mod }) => (
                  <Alert key={key} severity="info" variant="outlined" sx={{ mb: 1 }}>
                    📁 {SEGMENTS_LABELS[seg] || seg} — ◆ {MODULES_LABELS[mod] || mod} : aucune tâche saisie.
                  </Alert>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {totalTasks === 0 && <Alert severity="warning" sx={{ mb: 2 }}>Ajoutez au moins une tâche pour continuer.</Alert>}
      {totalTasks > 0 && !planResult && !genError && (
        <Alert severity="info" sx={{ mb: 2 }}>Cliquez sur « Générer le planning WBS » pour calculer les dates et le détail complet.</Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button variant="outlined" startIcon={<ArrowBack />} onClick={onPrevious}>Précédent</Button>
        <Button variant="contained" endIcon={<ArrowForward />} onClick={handleSave} disabled={totalTasks === 0 || factorsMutation.isPending || planningConfigMutation.isPending}>
          {(factorsMutation.isPending || planningConfigMutation.isPending) ? 'Sauvegarde…' : 'Sauvegarder et continuer'}
        </Button>
      </Box>
    </Box>
  );
}

// ═══════════════════════════════════════════════════════════════
// STEP 7 — Gantt  (Affichage graphique + export Excel)
// ═══════════════════════════════════════════════════════════════
function GanttChart({ tasks }: { tasks: any[] }) {
  const parse = (s: string) => new Date(`${s}T00:00:00`);
  const starts = tasks.map(t => parse(t.start_date).getTime());
  const ends = tasks.map(t => parse(t.end_date).getTime());
  const minTime = Math.min(...starts);
  const maxTime = Math.max(...ends);
  const span = Math.max(1, maxTime - minTime);

  const numMarkers = 8;
  const markers = Array.from({ length: numMarkers + 1 }, (_, i) => {
    const t = minTime + (span * i) / numMarkers;
    const d = new Date(t);
    return { pct: (i / numMarkers) * 100, label: d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) };
  });

  const sorted = tasks.slice().sort((a, b) => (a.start_date || '').localeCompare(b.start_date || '') || (a.phase || '').localeCompare(b.phase || ''));

  return (
    <Box sx={{ overflowX: 'auto' }}>
      <Box sx={{ minWidth: 900 }}>
        {/* Header row */}
        <Box sx={{ display: 'flex', borderBottom: '2px solid #1976d2', pb: 0.5, mb: 1 }}>
          <Box sx={{ width: 320, flexShrink: 0, fontWeight: 700, fontSize: 13, pl: 1 }}>Tâche</Box>
          <Box sx={{ flexGrow: 1, position: 'relative', height: 20 }}>
            {markers.map((m, i) => (
              <Typography key={i} variant="caption" sx={{ position: 'absolute', left: `${m.pct}%`, transform: i === numMarkers ? 'translateX(-100%)' : i === 0 ? 'none' : 'translateX(-50%)', color: 'text.secondary' }}>
                {m.label}
              </Typography>
            ))}
          </Box>
        </Box>

        {sorted.map((t, idx) => {
          const left = ((parse(t.start_date).getTime() - minTime) / span) * 100;
          const width = Math.max(0.8, ((parse(t.end_date).getTime() - parse(t.start_date).getTime()) / span) * 100);
          const color = phaseColor(t.phase);
          return (
            <Box key={t.id || idx} sx={{ display: 'flex', alignItems: 'center', py: 0.5, bgcolor: idx % 2 === 0 ? '#FAFAFA' : 'white', borderBottom: '1px solid #F0F0F0' }}>
              <Box sx={{ width: 320, flexShrink: 0, pl: 1, pr: 1 }}>
                <Typography variant="body2" fontWeight={600} noWrap title={t.name}>{t.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {SEGMENTS_LABELS[t.segment] || t.segment} · {MODULES_LABELS[t.module] || t.module} · {phaseLabel(t.phase)}
                </Typography>
              </Box>
              <Box sx={{ flexGrow: 1, position: 'relative', height: 24 }}>
                {/* Gridlines */}
                {markers.map((m, i) => (
                  <Box key={i} sx={{ position: 'absolute', left: `${m.pct}%`, top: 0, bottom: 0, borderLeft: '1px dashed #eee' }} />
                ))}
                <Tooltip title={`${t.name} — ${t.start_date} → ${t.end_date} (${t.duration_days} j, ${Number(t.total_jh || 0).toFixed(1)} JH)`}>
                  <Box sx={{
                    position: 'absolute', left: `${left}%`, width: `${width}%`, top: 3, bottom: 3,
                    bgcolor: color, borderRadius: 1, minWidth: 6,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.25)',
                  }} />
                </Tooltip>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

function Step7({ onNext, onPrevious, state }: { onNext: () => void; onPrevious: () => void; state: any }) {
  const [ganttResult, setGanttResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const autoTriggered = useRef(false);

  const planningMutation = usePlanningCalculate();
  const calcMutation = useCalculateEstimation();
  const exportExcel = useExport('excel');

  const hasManualPlanning = (state?.manual_planning || []).length > 0;

  const generate = async () => {
    if (!hasManualPlanning) return;
    setLoading(true); setError(null);
    try {
      const res = await planningMutation.mutateAsync(state);
      setGanttResult(res);
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Erreur lors de la génération du Gantt");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!autoTriggered.current && hasManualPlanning) {
      autoTriggered.current = true;
      generate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasManualPlanning]);

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const estimationResult = await calcMutation.mutateAsync(state);
      const blob = await exportExcel.mutateAsync({ wizard_state: state, estimation_result: estimationResult, formats: ['excel'] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${state?.project_info?.project_title || 'planning'}_Gantt.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    }
    setExporting(false);
  };

  const leafTasks: any[] = (ganttResult?.tasks || []).filter((t: any) => !t.is_phase);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">📊 Gantt</Typography>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button variant="outlined" size="small" startIcon={loading ? <CircularProgress size={16} /> : <Refresh />} onClick={generate} disabled={loading || !hasManualPlanning}>
            Actualiser
          </Button>
          <Button variant="contained" size="small" color="success" startIcon={exporting ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />}
            onClick={handleExportExcel} disabled={exporting || !leafTasks.length}>
            {exporting ? 'Export…' : 'Exporter en Excel'}
          </Button>
        </Box>
      </Box>

      {!hasManualPlanning && (
        <Alert severity="warning" sx={{ mb: 2 }}>Configurez et générez d'abord le planning à l'étape « Planning ».</Alert>
      )}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>}

      {!loading && leafTasks.length > 0 && (
        <Card sx={{ mb: 2 }}><CardContent>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6} md={3}><Paper elevation={0} sx={{ p: 1.5, bgcolor: '#EBF5FB', borderRadius: 1, textAlign: 'center' }}><Typography variant="h6" fontWeight={700}>{ganttResult.total_duration_days}</Typography><Typography variant="caption">Jours total</Typography></Paper></Grid>
            <Grid item xs={6} md={3}><Paper elevation={0} sx={{ p: 1.5, bgcolor: '#EBF5FB', borderRadius: 1, textAlign: 'center' }}><Typography variant="h6" fontWeight={700}>{ganttResult.total_jh?.toFixed(1)}</Typography><Typography variant="caption">JH total</Typography></Paper></Grid>
            <Grid item xs={6} md={3}><Paper elevation={0} sx={{ p: 1.5, bgcolor: '#EBF5FB', borderRadius: 1, textAlign: 'center' }}><Typography variant="h6" fontWeight={700}>{leafTasks.length}</Typography><Typography variant="caption">Tâches</Typography></Paper></Grid>
            <Grid item xs={6} md={3}>
              <Paper elevation={0} sx={{ p: 1.5, bgcolor: '#EBF5FB', borderRadius: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center', alignItems: 'center' }}>
                {PHASES.map(p => <Chip key={p.key} label={p.label} size="small" sx={{ bgcolor: p.color, color: 'white', fontSize: 10, height: 18 }} />)}
              </Paper>
            </Grid>
          </Grid>
          <GanttChart tasks={leafTasks} />
        </CardContent></Card>
      )}

      {!loading && hasManualPlanning && !leafTasks.length && !error && (
        <Alert severity="info" sx={{ mb: 2 }}>Cliquez sur « Actualiser » pour générer le Gantt.</Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button variant="outlined" startIcon={<ArrowBack />} onClick={onPrevious}>Précédent</Button>
        <Button variant="contained" endIcon={<ArrowForward />} onClick={onNext}>Continuer</Button>
      </Box>
    </Box>
  );
}

// ═══════════════════════════════════════════════════════════════
// STEP 8 — Voyages
// ═══════════════════════════════════════════════════════════════
function Step8({ onNext, onPrevious, state }: { onNext: () => void; onPrevious: () => void; state: any }) {
  const existing = state?.travel_costs || {};
  const [perDiem, setPerDiem] = useState(existing.per_diem || 50);
  const [hotel, setHotel]     = useState(existing.hotel_rate || 150);
  const [flight, setFlight]   = useState(existing.flight_cost || 500);
  const [expenses, setExpenses] = useState<any[]>(() => (existing.expenses || []).map((ex: any) => ({ ...ex, start_date: new Date(ex.start_date), end_date: new Date(ex.end_date) })));
  const mutation = useWizardStep(8);
  const handleSave = async () => {
    await mutation.mutateAsync({ per_diem: perDiem, hotel_rate: hotel, flight_cost: flight, expenses: expenses.map(e => ({ ...e, start_date: e.start_date?.toISOString().split('T')[0], end_date: e.end_date?.toISOString().split('T')[0] })) });
    onNext();
  };
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
      <Card><CardContent>
        <Typography variant="h5" gutterBottom>Frais de Voyage</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}><TextField label="Per Diem / jour" type="number" value={perDiem} onChange={e => setPerDiem(parseFloat(e.target.value) || 0)} fullWidth /></Grid>
          <Grid item xs={12} md={4}><TextField label="Hôtel / nuit" type="number" value={hotel} onChange={e => setHotel(parseFloat(e.target.value) || 0)} fullWidth /></Grid>
          <Grid item xs={12} md={4}><TextField label="Vol A/R" type="number" value={flight} onChange={e => setFlight(parseFloat(e.target.value) || 0)} fullWidth /></Grid>
        </Grid>
        <Divider sx={{ my: 2 }} />
        <Typography variant="h6">Déplacements par phase</Typography>
        {PHASES.map((phase, idx) => (
          <Accordion key={phase.key}>
            <AccordionSummary expandIcon={<ExpandMore />}><Typography>{phase.label}</Typography></AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}><TextField label="Nombre de personnes" type="number" value={expenses[idx]?.onsite_resources || 0} onChange={e => { const u = [...expenses]; if (!u[idx]) u[idx] = { phase: phase.key, onsite_resources: 0, start_date: new Date(), end_date: new Date() }; u[idx].onsite_resources = parseInt(e.target.value) || 0; setExpenses(u); }} fullWidth /></Grid>
                <Grid item xs={12} md={4}><DatePicker label="Date début" value={expenses[idx]?.start_date || null} onChange={date => { const u = [...expenses]; if (!u[idx]) u[idx] = { phase: phase.key, onsite_resources: 0, start_date: date || new Date(), end_date: new Date() }; u[idx].start_date = date; setExpenses(u); }} /></Grid>
                <Grid item xs={12} md={4}><DatePicker label="Date fin" value={expenses[idx]?.end_date || null} onChange={date => { const u = [...expenses]; if (!u[idx]) u[idx] = { phase: phase.key, onsite_resources: 0, start_date: new Date(), end_date: date || new Date() }; u[idx].end_date = date; setExpenses(u); }} /></Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        ))}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button variant="outlined" startIcon={<ArrowBack />} onClick={onPrevious}>Précédent</Button>
          <Button variant="contained" endIcon={<ArrowForward />} onClick={handleSave} disabled={mutation.isPending}>
            {mutation.isPending ? 'Sauvegarde...' : 'Sauvegarder et continuer'}
          </Button>
        </Box>
      </CardContent></Card>
    </LocalizationProvider>
  );
}

// ═══════════════════════════════════════════════════════════════
// STEP 9 — Génération
// ═══════════════════════════════════════════════════════════════
function Step9({ onPrevious, state }: { onPrevious: () => void; state: any }) {
  const calcMutation = useCalculateEstimation();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const exportXml   = useExport('xml');
  const exportExcel = useExport('excel');
  const exportPdf   = useExport('pdf');
  const cur = state?.project_info?.currency || '';

  const calculate = async () => { setLoading(true); try { setResult(await calcMutation.mutateAsync(state)); } catch (e) { console.error(e); } setLoading(false); };
  const handleExport = async (format: 'xml' | 'excel' | 'pdf', filename: string) => {
    const data = { wizard_state: state, estimation_result: result, formats: [format] };
    try {
      const blob = await (format === 'pdf' ? exportPdf.mutateAsync(data) : format === 'excel' ? exportExcel.mutateAsync(data) : exportXml.mutateAsync(data));
      const url = window.URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = filename; link.click(); window.URL.revokeObjectURL(url);
    } catch (e) { console.error(e); }
  };

  if (!state?.estimations) return <Alert severity="warning">Renseignez d'abord les estimations.</Alert>;
  if (!result && !loading) return (
    <Card><CardContent>
      <Typography variant="h5" gutterBottom>🧾 Récapitulatif & Génération</Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>Calculez l'estimation finale pour activer les exports.</Typography>
      <Button variant="contained" onClick={calculate}>Calculer l'estimation finale</Button>
    </CardContent></Card>
  );
  if (loading) return <CircularProgress />;

  const phasesData = result?.phases || {};
  const resourcesData = result?.resources || {};
  const moduleResults: any[] = result?.modules || [];
  const groupedModules = moduleResults.reduce((acc, mr) => { const k = mr.segment || 'global'; acc[k] = acc[k] ?? []; acc[k].push(mr); return acc; }, {} as Record<string, any[]>);

  return (
    <Box>
      <Card sx={{ mb: 2 }}><CardContent>
        <Typography variant="h5" gutterBottom>🧾 Résultat de l'Estimation</Typography>
        <Alert severity="success" sx={{ mb: 3 }}>✅ Estimation calculée avec succès</Alert>
        <Grid container spacing={2}>
          {[
            { label: 'Total JH', value: `${Math.round(result?.total_jh || 0)} JH` },
            { label: 'Coût Total', value: `${Math.round(result?.total_cost || 0).toLocaleString()} ${cur}` },
            { label: 'Marge', value: `${Math.round(result?.margin || 0).toLocaleString()} ${cur}` },
            { label: 'Prix de Vente', value: `${Math.round(result?.selling_price || 0).toLocaleString()} ${cur}` },
            { label: 'Frais Déplacement', value: `${Math.round(result?.travel_cost || 0).toLocaleString()} ${cur}` },
            { label: 'PRIX TOTAL', value: `${Math.round(result?.total_price || 0).toLocaleString()} ${cur}`, highlight: true },
          ].map(({ label, value, highlight }) => (
            <Grid item xs={12} sm={6} md={2} key={label}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: highlight ? '#1F4E79' : 'white', color: highlight ? 'white' : 'inherit', borderRadius: 2 }}>
                <Typography variant="h6" fontWeight="bold">{value}</Typography>
                <Typography variant="caption">{label}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </CardContent></Card>

      <Card sx={{ mb: 2 }}><CardContent>
        <Typography variant="h6" gutterBottom>📌 JH par segment et module</Typography>
        {Object.entries(groupedModules).map(([segKey, mods]) => (
          <Box key={segKey} sx={{ mb: 2 }}>
            <Typography fontWeight="bold" sx={{ mb: 1 }}>{segKey === 'global' ? 'Sans segment' : SEGMENTS_LABELS[segKey] || segKey}</Typography>
            <TableContainer component={Paper} variant="outlined"><Table size="small">
              <TableHead><TableRow sx={{ bgcolor: '#f2f7ff' }}>
                <TableCell>Module</TableCell><TableCell align="center">Total JH</TableCell>
                {PHASES.map(ph => <TableCell key={ph.key} align="center">{ph.label}</TableCell>)}
              </TableRow></TableHead>
              <TableBody>
                {(mods as any[]).map((mr: any) => (
                  <TableRow key={mr.module}>
                    <TableCell>{MODULES_LABELS[mr.module] || mr.module}</TableCell>
                    <TableCell align="center">{Math.round(mr.total_jh)}</TableCell>
                    {PHASES.map(ph => { const pe = (mr.phases || []).find((p: any) => p.phase === ph.key); return <TableCell key={ph.key} align="center">{pe ? Math.round(pe.jh) : '-'}</TableCell>; })}
                  </TableRow>
                ))}
              </TableBody>
            </Table></TableContainer>
          </Box>
        ))}
      </CardContent></Card>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={6}><Card><CardContent>
          <Typography variant="h6" gutterBottom>Distribution par Phase</Typography>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={Object.entries(phasesData).map(([k, v]) => ({ name: k, JH: v }))}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis /><RechartsTooltip /><Bar dataKey="JH" fill="#1976d2" radius={[4, 4, 0, 0]} /></BarChart>
          </ResponsiveContainer>
        </CardContent></Card></Grid>
        <Grid item xs={12} md={6}><Card><CardContent>
          <Typography variant="h6" gutterBottom>Distribution par Ressource</Typography>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart><Pie data={Object.entries(resourcesData).map(([k, v]) => ({ name: k, value: v }))} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}>{Object.keys(resourcesData).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><RechartsTooltip /><Legend /></PieChart>
          </ResponsiveContainer>
        </CardContent></Card></Grid>
      </Grid>

      <Card sx={{ mb: 2 }}><CardContent>
        <Typography variant="h6" gutterBottom>📥 Documents</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}><Button fullWidth variant="contained" color="error" startIcon={<DownloadIcon />} onClick={() => handleExport('pdf', `${state?.project_info?.project_title || 'estimation'}.pdf`)} disabled={exportPdf.isPending} sx={{ py: 1.5 }}>{exportPdf.isPending ? 'Génération...' : '📄 PDF Complet'}</Button></Grid>
          <Grid item xs={12} sm={4}><Button fullWidth variant="contained" color="success" startIcon={<DownloadIcon />} onClick={() => handleExport('excel', `${state?.project_info?.project_title || 'planning'}_WBS.xlsx`)} disabled={exportExcel.isPending} sx={{ py: 1.5 }}>{exportExcel.isPending ? 'Génération...' : '📊 Excel Complet'}</Button></Grid>
          <Grid item xs={12} sm={4}><Button fullWidth variant="outlined" startIcon={<DownloadIcon />} onClick={() => handleExport('xml', `${state?.project_info?.project_title || 'project'}.xml`)} disabled={exportXml.isPending} sx={{ py: 1.5 }}>{exportXml.isPending ? 'Génération...' : '🗂️ XML MS Project'}</Button></Grid>
        </Grid>
      </CardContent></Card>
      <Button variant="outlined" startIcon={<ArrowBack />} onClick={onPrevious}>Précédent</Button>
    </Box>
  );
}

// ═══════════════════════════════════════════════════════════════
// APP  — 9 steps, Sidebar + renderStep alignés
// ═══════════════════════════════════════════════════════════════
function App() {
  const [currentStep, setCurrentStep] = useState(1);
  const { data: state, isLoading } = useWizardState();
  const resetMutation = useResetWizard();

  useEffect(() => { console.info('[wizard] state updated', state); }, [state]);

  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <Step1 onNext={() => setCurrentStep(2)} state={state} />;
      case 2: return <Step2 onNext={() => setCurrentStep(3)} onPrevious={() => setCurrentStep(1)} state={state} />;
      case 3: return <Step3 onNext={() => setCurrentStep(4)} onPrevious={() => setCurrentStep(2)} state={state} />;
      case 4: return <Step4 onNext={() => setCurrentStep(5)} onPrevious={() => setCurrentStep(3)} state={state} />;
      case 5: return <Step5 onNext={() => setCurrentStep(6)} onPrevious={() => setCurrentStep(4)} state={state} />;
      case 6: return <Step6 onNext={() => setCurrentStep(7)} onPrevious={() => setCurrentStep(5)} state={state} />;
      case 7: return <Step7 onNext={() => setCurrentStep(8)} onPrevious={() => setCurrentStep(6)} state={state} />;
      case 8: return <Step8 onNext={() => setCurrentStep(9)} onPrevious={() => setCurrentStep(7)} state={state} />;
      case 9: return <Step9 onPrevious={() => setCurrentStep(8)} state={state} />;
      default: return null;
    }
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <Sidebar
        currentStep={currentStep}
        onStepChange={setCurrentStep}
        onReset={() => resetMutation.mutate()}
        isResetting={resetMutation.isPending}
      />
      <Box component="main" sx={{ flexGrow: 1, p: 3, overflow: 'auto', bgcolor: '#f5f5f5' }}>
        <Toolbar />
        <Container maxWidth="xl">{renderStep()}</Container>
      </Box>
    </Box>
  );
}

export default App;