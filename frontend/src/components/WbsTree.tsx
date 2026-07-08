import { useMemo } from 'react';
import { Box, Typography, Chip, Paper } from '@mui/material';

// ─── INTERFACES ET CONFIGURATIONS ────────────────────────────────────────────

const SEGMENTS_LABELS: Record<string, string> = { 
  retail: 'Retail', sme: 'SME', corporate: 'Corporate', fi: 'FI', default: 'Défaut' 
};

const MODULES_LABELS: Record<string, string> = {
  kyc_boarding: 'KYC & Onboarding', loan_origination: 'Loan Origination', scoring: 'Scoring',
  underwriting_approval: 'Underwriting & Approval', limit_management: 'Limit Management',
  collateral_management: 'Collateral Management', loan_servicing: 'Loan Servicing',
  collection_provisioning: 'Collection & Provisioning', early_warning: 'Early Warning System',
  ai_lending: 'AI-Powered Lending', omnichannel: 'Omnichannel', bi_reporting: 'BI & Reporting',
};

const PHASE_META: Record<string, { label: string; code: string; color: string }> = {
  prescoping: { label: 'Pré-cadrage', code: '1', color: '#5DADE2' },
  scoping:    { label: 'Cadrage', code: '2', color: '#2E86C1' },
  build:      { label: 'Développement', code: '3', color: '#1F4E79' },
  testing:    { label: 'Tests', code: '4', color: '#148F77' },
  go_live:    { label: 'Mise en Production', code: '5', color: '#1E8449' },
  support:    { label: 'Support', code: '6', color: '#D4AC0D' },
};

// Configuration des couleurs par niveau
const LEVEL_CONFIG = {
  project: { label: 'Projet', color: '#1F4E79', bgColor: '#1F4E79', textColor: '#FFFFFF', icon: '📋' },
  segment: { label: 'Segment', color: '#2E86C1', bgColor: '#2E86C1', textColor: '#FFFFFF', icon: '🏢' },
  module:  { label: 'Module', color: '#5DADE2', bgColor: '#5DADE2', textColor: '#FFFFFF', icon: '📦' },
  phase:   { label: 'Phase', color: '#85C1E9', bgColor: '#EBF5FB', textColor: '#1A5276', icon: '🔄' },
  task:    { label: 'Tâche', color: '#D6EAF8', bgColor: '#F7FBFF', textColor: '#1A5276', icon: '✅' },
};

// ─── BOÎTE POUR ORGANIGRAMME VERTICAL ─────────────────────────────────────────

function OrgBox({ 
  label, 
  code, 
  sublabel, 
  level,
  isRoot = false,
  isTask = false,
}: { 
  label: string; 
  code: string; 
  sublabel?: string; 
  level: keyof typeof LEVEL_CONFIG;
  isRoot?: boolean;
  isTask?: boolean;
}) {
  const config = LEVEL_CONFIG[level];
  
  return (
    <Paper
      elevation={isRoot ? 4 : 2}
      sx={{
        width: isRoot ? 200 : isTask ? 170 : 190,
        minHeight: isRoot ? 70 : isTask ? 44 : 56,
        bgcolor: config.bgColor,
        color: config.textColor,
        border: `2.5px solid ${config.color}`,
        borderRadius: isRoot ? '50%' : 2,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        p: isRoot ? 2 : isTask ? 0.8 : 1.5,
        position: 'relative',
        boxShadow: isRoot 
          ? '0 4px 20px rgba(31, 78, 121, 0.3)' 
          : '0 2px 8px rgba(0,0,0,0.08)',
        userSelect: 'none',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'default',
        '&:hover': {
          boxShadow: '0 6px 24px rgba(0,0,0,0.15)',
          transform: 'translateY(-3px) scale(1.02)',
        },
        zIndex: 1,
      }}
    >
      {/* Badge de niveau */}
      {!isTask && (
        <Chip
          label={`${config.icon} ${config.label}`}
          size="small"
          sx={{
            position: 'absolute',
            top: -12,
            right: -12,
            height: 22,
            fontSize: 9,
            fontWeight: 700,
            bgcolor: config.color,
            color: '#FFFFFF',
            '& .MuiChip-label': { px: 1, py: 0.25 },
            boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
          }}
        />
      )}
      
      {/* Code WBS */}
      <Box sx={{
        position: 'absolute',
        top: 4,
        left: 8,
        fontSize: isTask ? 7 : 8,
        fontWeight: 700,
        color: level === 'project' || level === 'segment' || level === 'module' 
          ? 'rgba(255,255,255,0.5)' 
          : 'rgba(0,0,0,0.3)',
        letterSpacing: 0.5,
      }}>
        {code}
      </Box>
      
      {/* Label */}
      <Typography sx={{ 
        fontSize: isRoot ? 15 : isTask ? 10 : level === 'segment' ? 13 : level === 'module' ? 12 : 11,
        fontWeight: isRoot ? 800 : isTask ? 500 : level === 'segment' ? 700 : 600,
        textAlign: 'center',
        lineHeight: 1.2,
        wordBreak: 'break-word',
        px: 0.5,
      }}>
        {label}
      </Typography>
      
      {/* Sous-label (JH) */}
      {sublabel && (
        <Typography sx={{ 
          fontSize: isTask ? 8 : 9.5, 
          color: level === 'project' || level === 'segment' || level === 'module' 
            ? 'rgba(255,255,255,0.8)' 
            : '#666666',
          fontWeight: 500,
          mt: 0.3,
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
        }}>
          <span style={{ fontSize: isTask ? 8 : 10 }}>⏱</span> {sublabel}
        </Typography>
      )}
    </Paper>
  );
}

// ─── COMPOSANT ORGANIGRAMME VERTICAL ─────────────────────────────────────────

export default function WbsTree({ tasks, projectName = 'Projet Informatique' }: { tasks: any[]; projectName?: string }) {
  
  const wbsData = useMemo(() => {
    // Grouper les tâches par segment → module → phase
    const grouped: Record<string, { modules: Record<string, { phases: Record<string, any[]> }> }> = {};
    
    tasks.forEach(t => {
      if (!t.name?.trim()) return;
      const seg = t.segment || 'default';
      const mod = t.module || 'default';
      const ph = t.phase || 'default';
      
      if (!grouped[seg]) grouped[seg] = { modules: {} };
      if (!grouped[seg].modules[mod]) grouped[seg].modules[mod] = { phases: {} };
      if (!grouped[seg].modules[mod].phases[ph]) grouped[seg].modules[mod].phases[ph] = [];
      
      grouped[seg].modules[mod].phases[ph].push(t);
    });
    
    // Calcul des JH totaux
    const totalProjectJH = tasks.reduce((sum, t) => sum + (t.total_jh || 0), 0);
    
    // Construire la structure hiérarchique
    const segments: any[] = [];
    let segIdx = 1;
    
    Object.keys(grouped).forEach((segKey) => {
      const segTasks = Object.values(grouped[segKey].modules).flatMap(mod => 
        Object.values(mod.phases).flat()
      );
      const segJH = segTasks.reduce((s, t) => s + (t.total_jh || 0), 0);
      
      const modules: any[] = [];
      let modIdx = 1;
      
      Object.keys(grouped[segKey].modules).forEach((modKey) => {
        const modTasks = Object.values(grouped[segKey].modules[modKey].phases).flat();
        const modJH = modTasks.reduce((s, t) => s + (t.total_jh || 0), 0);
        
        const phases: any[] = [];
        let phIdx = 1;
        
        Object.keys(grouped[segKey].modules[modKey].phases).forEach((phKey) => {
          const phMeta = PHASE_META[phKey] || { label: phKey, code: String(phIdx), color: '#888' };
          const phTasks = grouped[segKey].modules[modKey].phases[phKey];
          const phJH = phTasks.reduce((s, t) => s + (t.total_jh || 0), 0);
          
          const taskNodes = phTasks.map((task, tIdx) => ({
            id: task.id,
            label: task.name,
            code: `${segIdx}${modIdx}${phMeta.code}${tIdx + 1}`,
            sublabel: task.total_jh ? `${Number(task.total_jh).toFixed(1)} JH` : undefined,
            level: 'task' as const,
            duration: task.duration_days,
            onsite: task.onsite_resources,
            remote: task.remote_resources,
            data: task,
          }));
          
          phases.push({
            id: `ph-${segKey}-${modKey}-${phKey}`,
            label: phMeta.label,
            code: `${segIdx}${modIdx}${phMeta.code}0`,
            sublabel: phJH > 0 ? `${phJH.toFixed(1)} JH` : undefined,
            level: 'phase' as const,
            color: phMeta.color,
            children: taskNodes,
          });
          phIdx++;
        });
        
        modules.push({
          id: `mod-${segKey}-${modKey}`,
          label: MODULES_LABELS[modKey] || modKey,
          code: `${segIdx}${modIdx}00`,
          sublabel: modJH > 0 ? `${modJH.toFixed(1)} JH` : undefined,
          level: 'module' as const,
          children: phases,
        });
        modIdx++;
      });
      
      segments.push({
        id: `seg-${segKey}`,
        label: SEGMENTS_LABELS[segKey] || segKey,
        code: `${segIdx}000`,
        sublabel: segJH > 0 ? `${segJH.toFixed(1)} JH` : undefined,
        level: 'segment' as const,
        children: modules,
      });
      segIdx++;
    });
    
    return {
      project: {
        label: projectName,
        code: 'P000',
        sublabel: totalProjectJH > 0 ? `${totalProjectJH.toFixed(1)} JH` : undefined,
        level: 'project' as const,
        children: segments,
      }
    };
  }, [tasks, projectName]);

  // ─── Rendu de l'organigramme vertical ──────────────────────────────────────

  const renderNode = (node: any, isRoot: boolean = false) => {
    const hasChildren = node.children && node.children.length > 0;
    const isTask = node.level === 'task';
    
    return (
      <Box key={node.id} sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        position: 'relative',
        width: '100%',
      }}>
        <OrgBox
          label={node.label}
          code={node.code}
          sublabel={node.sublabel}
          level={node.level}
          isRoot={isRoot}
          isTask={isTask}
        />
        
        {hasChildren && (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'row', 
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: isRoot ? 6 : 4,
            mt: 2.5,
            position: 'relative',
            width: '100%',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: -8,
              left: '50%',
              width: 2,
              height: 16,
              bgcolor: '#B0BEC5',
            },
          }}>
            {node.children.map((child: any) => (
              <Box key={child.id} sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                position: 'relative',
                flex: '0 1 auto',
                minWidth: 180,
                maxWidth: 240,
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: -8,
                  left: '50%',
                  width: 2,
                  height: 16,
                  bgcolor: '#B0BEC5',
                },
              }}>
                {renderNode(child, false)}
              </Box>
            ))}
          </Box>
        )}
      </Box>
    );
  };

  const hasContent = wbsData.project.children && wbsData.project.children.length > 0;

  return (
    <Box sx={{ 
      p: 3, 
      bgcolor: '#F8FAFC', 
      overflowX: 'auto', 
      borderRadius: 2, 
      border: '1px solid #E8EDF2',
      minHeight: 300,
    }}>
      {/* En-tête */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        mb: 3,
        flexWrap: 'wrap',
        gap: 2,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6" fontWeight={700} color="#1F4E79">
            📊 Organigramme WBS
          </Typography>
          <Chip 
            label="PMI Standard" 
            size="small" 
            sx={{ 
              bgcolor: '#1F4E79', 
              color: 'white', 
              fontWeight: 600,
              fontSize: 9,
              height: 20,
            }} 
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {tasks.length > 0 && (
            <>
              <Chip label={`${tasks.length} tâches`} size="small" color="primary" />
              <Chip 
                label={`${wbsData.project.sublabel || '0 JH'}`} 
                size="small" 
                variant="outlined" 
              />
            </>
          )}
        </Box>
      </Box>

      {/* Légende */}
      <Box sx={{ 
        display: 'flex', 
        gap: 2, 
        mb: 3, 
        flexWrap: 'wrap', 
        justifyContent: 'center',
        p: 1.5,
        bgcolor: 'white',
        borderRadius: 1,
        border: '1px solid #E8EDF2',
      }}>
        {Object.entries(LEVEL_CONFIG).map(([key, config]) => (
          <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box sx={{ 
              width: 16, 
              height: 16, 
              bgcolor: config.bgColor, 
              border: `2px solid ${config.color}`,
              borderRadius: key === 'project' ? '50%' : 1.5,
            }} />
            <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ fontSize: 10 }}>
              {config.icon} {config.label}
            </Typography>
          </Box>
        ))}
      </Box>
      
      {/* Arbre WBS vertical */}
      {hasContent ? (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          width: '100%',
          minWidth: 300,
          py: 2,
        }}>
          {renderNode(wbsData.project, true)}
        </Box>
      ) : (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          py: 8,
          flexDirection: 'column',
          gap: 2,
        }}>
          <Typography variant="body1" color="text.secondary">
            Aucune tâche à afficher dans la structure WBS
          </Typography>
          <Typography variant="caption" color="text.disabled">
            Générez d'abord le planning pour voir l'organigramme
          </Typography>
        </Box>
      )}
      
      {/* Pied de page */}
      {tasks.length > 0 && (
        <Box sx={{ 
          mt: 3, 
          pt: 2, 
          borderTop: '1px solid #E8EDF2',
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1,
        }}>
          <Typography variant="caption" color="text.secondary">
            WBS ID: {wbsData.project.code} · {wbsData.project.children?.length || 0} segment(s)
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Structure conforme aux normes PMI / WBS
          </Typography>
        </Box>
      )}
    </Box>
  );
}