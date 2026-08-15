'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3-force';
import {
  FileText, Globe, Mic, PlayCircle, HelpCircle, Layers, CheckCircle2,
  AlertCircle, ZoomIn, ZoomOut, RefreshCw, Maximize2, Minimize2, Search, Filter
} from 'lucide-react';
import Link from 'next/link';

export interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  full_title?: string;
  full_question?: string;
  type: 'root' | 'subject' | 'topic' | 'note' | 'question';
  content_type?: string;
  subject?: string;
  topic?: string;
  is_due?: boolean;
  revision_status?: string;
  ai_processed?: boolean;
  note_id?: number;
  question_id?: number;
  val: number;
  color: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  label?: string;
  dashed?: boolean;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
  stats: {
    total_nodes: number;
    total_notes: number;
    total_questions: number;
    due_count: number;
  };
}

interface KnowledgeGraphProps {
  data: GraphData;
  onSelectNote?: (noteId: number) => void;
}

export default function KnowledgeGraph({ data, onSelectNote }: KnowledgeGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Transform state for pan & zoom
  const transformRef = useRef({ x: 0, y: 0, k: 1 });
  const isDraggingCanvasRef = useRef(false);
  const isDraggingNodeRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const draggedNodeRef = useRef<GraphNode | null>(null);

  // Extract unique subjects & content types for filter bar
  const subjects = useMemo(() => {
    const set = new Set<string>();
    data.nodes.forEach(n => { if (n.subject) set.add(n.subject); });
    return Array.from(set);
  }, [data]);

  const contentTypes = ['pdf', 'youtube', 'voice', 'link', 'text'];

  // Filtered nodes
  const activeNodeIds = useMemo(() => {
    const set = new Set<string>();
    data.nodes.forEach(n => {
      let matchSearch = true;
      let matchSubject = true;
      let matchType = true;

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        matchSearch = (n.label || '').toLowerCase().includes(query) ||
                      (n.full_title || '').toLowerCase().includes(query) ||
                      (n.subject || '').toLowerCase().includes(query) ||
                      (n.topic || '').toLowerCase().includes(query);
      }

      if (selectedSubject !== 'all') {
        matchSubject = n.type === 'root' || n.subject === selectedSubject || n.label === selectedSubject;
      }

      if (selectedType !== 'all') {
        matchType = n.type !== 'note' || n.content_type === selectedType;
      }

      if (matchSearch && matchSubject && matchType) {
        set.add(n.id);
      }
    });
    return set;
  }, [data, searchTerm, selectedSubject, selectedType]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    // Deep clone nodes & links for d3 mutation
    const nodes: GraphNode[] = data.nodes.map(n => ({ ...n }));
    const links: GraphLink[] = data.links.map(l => ({ ...l }));

    // Center point
    transformRef.current.x = width / 2;
    transformRef.current.y = height / 2;

    // Build d3 force simulation
    const simulation = d3.forceSimulation<GraphNode>(nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(links)
        .id(d => d.id)
        .distance(d => (d.dashed ? 120 : d.source === 'root' ? 140 : 80))
      )
      .force('charge', d3.forceManyBody().strength(d => (d as GraphNode).type === 'root' ? -800 : -350))
      .force('collide', d3.forceCollide<GraphNode>().radius(d => d.val + 14))
      .force('center', d3.forceCenter(0, 0));

    let animId: number;
    let pulseTime = 0;

    // Render Loop
    const render = () => {
      pulseTime += 0.04;
      ctx.save();
      ctx.clearRect(0, 0, width, height);

      const { x: tx, y: ty, k } = transformRef.current;

      ctx.translate(tx, ty);
      ctx.scale(k, k);

      // ── 1. Draw Links ──────────────────────────────────────────────────────
      links.forEach(link => {
        const source = link.source as GraphNode;
        const target = link.target as GraphNode;
        if (!source.x || !source.y || !target.x || !target.y) return;

        const isHighlighted = activeNodeIds.has(source.id) && activeNodeIds.has(target.id);
        const opacity = isHighlighted ? (link.dashed ? 0.35 : 0.6) : 0.1;

        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);

        if (link.dashed) {
          ctx.setLineDash([4, 4]);
          ctx.strokeStyle = `rgba(167, 139, 250, ${opacity})`;
          ctx.lineWidth = 1.2;
        } else {
          ctx.setLineDash([]);
          ctx.strokeStyle = isHighlighted ? 'rgba(99, 102, 241, 0.4)' : 'rgba(226, 232, 240, 0.3)';
          ctx.lineWidth = source.type === 'root' ? 2 : 1.5;
        }

        ctx.stroke();
        ctx.setLineDash([]);
      });

      // ── 2. Draw Nodes ──────────────────────────────────────────────────────
      nodes.forEach(node => {
        if (node.x === undefined || node.y === undefined) return;

        const isMatch = activeNodeIds.has(node.id);
        const isHovered = hoveredNode?.id === node.id;
        const isSelected = selectedNode?.id === node.id;

        const radius = node.val;
        const alpha = isMatch ? 1 : 0.2;

        ctx.save();
        ctx.globalAlpha = alpha;

        // Draw pulsing outer ring for overdue revision notes
        if (node.is_due && isMatch) {
          const pulseR = radius + 6 + Math.sin(pulseTime * 3) * 4;
          ctx.beginPath();
          ctx.arc(node.x, node.y, pulseR, 0, 2 * Math.PI);
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.8)';
          ctx.lineWidth = 2.5;
          ctx.stroke();
        }

        // Draw selected / hovered halo
        if (isHovered || isSelected) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, radius + 8, 0, 2 * Math.PI);
          ctx.fillStyle = isSelected ? 'rgba(99, 102, 241, 0.25)' : 'rgba(167, 139, 250, 0.2)';
          ctx.fill();
          ctx.strokeStyle = isSelected ? '#6366f1' : '#a78bfa';
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Main Node Circle with Radial Gradient
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);

        const grad = ctx.createRadialGradient(
          node.x - radius * 0.3, node.y - radius * 0.3, radius * 0.1,
          node.x, node.y, radius
        );

        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.3, node.color);
        grad.addColorStop(1, adjustColor(node.color, -30));

        ctx.fillStyle = grad;
        ctx.shadowColor = `${node.color}66`;
        ctx.shadowBlur = isHovered ? 16 : 8;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = node.type === 'root' ? 3 : 1.5;
        ctx.stroke();

        // Node Icon or Type Indicator
        if (node.type === 'root') {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 16px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🧠', node.x, node.y);
        } else if (node.type === 'subject') {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 12px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('📚', node.x, node.y);
        } else if (node.type === 'topic') {
          ctx.fillStyle = '#ffffff';
          ctx.font = '10px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('📌', node.x, node.y);
        }

        // Node Label below node
        ctx.font = node.type === 'root' ? 'bold 13px Inter, sans-serif' : '600 11px Inter, sans-serif';
        ctx.fillStyle = isMatch ? (node.type === 'root' ? '#4f46e5' : '#1e293b') : '#94a3b8';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        // Truncate label for canvas text
        const displayLabel = node.label.length > 22 ? node.label.slice(0, 20) + '…' : node.label;
        ctx.fillText(displayLabel, node.x, node.y + radius + 5);

        ctx.restore();
      });

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    // ── Mouse & Drag Handlers ────────────────────────────────────────────────
    const getCanvasPos = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const { x: tx, y: ty, k } = transformRef.current;
      const worldX = (screenX - tx) / k;
      const worldY = (screenY - ty) / k;
      return { screenX, screenY, worldX, worldY };
    };

    const findNodeAt = (wx: number, wy: number) => {
      return nodes.find(n => {
        if (n.x === undefined || n.y === undefined) return false;
        const dx = n.x - wx;
        const dy = n.y - wy;
        return Math.sqrt(dx * dx + dy * dy) <= n.val + 6;
      });
    };

    const onMouseDown = (e: MouseEvent) => {
      const { screenX, screenY, worldX, worldY } = getCanvasPos(e);
      const hitNode = findNodeAt(worldX, worldY);

      if (hitNode) {
        isDraggingNodeRef.current = true;
        draggedNodeRef.current = hitNode;
        hitNode.fx = hitNode.x;
        hitNode.fy = hitNode.y;
        simulation.alphaTarget(0.3).restart();
      } else {
        isDraggingCanvasRef.current = true;
        dragStartRef.current = { x: screenX - transformRef.current.x, y: screenY - transformRef.current.y };
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      const { screenX, screenY, worldX, worldY } = getCanvasPos(e);

      if (isDraggingNodeRef.current && draggedNodeRef.current) {
        draggedNodeRef.current.fx = worldX;
        draggedNodeRef.current.fy = worldY;
      } else if (isDraggingCanvasRef.current) {
        transformRef.current.x = screenX - dragStartRef.current.x;
        transformRef.current.y = screenY - dragStartRef.current.y;
      } else {
        const hitNode = findNodeAt(worldX, worldY);
        setHoveredNode(hitNode || null);
        canvas.style.cursor = hitNode ? 'pointer' : 'grab';
      }
    };

    const onMouseUp = () => {
      if (isDraggingNodeRef.current && draggedNodeRef.current) {
        draggedNodeRef.current.fx = null;
        draggedNodeRef.current.fy = null;
        draggedNodeRef.current = null;
        isDraggingNodeRef.current = false;
        simulation.alphaTarget(0);
      }
      isDraggingCanvasRef.current = false;
    };

    const onClick = (e: MouseEvent) => {
      const { worldX, worldY } = getCanvasPos(e);
      const hitNode = findNodeAt(worldX, worldY);
      setSelectedNode(hitNode || null);
      if (hitNode?.note_id && onSelectNote) {
        onSelectNote(hitNode.note_id);
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      const newK = Math.max(0.3, Math.min(3, transformRef.current.k * zoomFactor));

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      transformRef.current.x = mouseX - (mouseX - transformRef.current.x) * (newK / transformRef.current.k);
      transformRef.current.y = mouseY - (mouseY - transformRef.current.y) * (newK / transformRef.current.k);
      transformRef.current.k = newK;
    };

    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('click', onClick);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      cancelAnimationFrame(animId);
      simulation.stop();
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('click', onClick);
      canvas.removeEventListener('wheel', onWheel);
    };
  }, [data, activeNodeIds, hoveredNode, selectedNode, onSelectNote]);

  const handleZoom = (factor: number) => {
    transformRef.current.k = Math.max(0.3, Math.min(3, transformRef.current.k * factor));
  };

  const handleResetZoom = () => {
    if (!containerRef.current) return;
    transformRef.current = {
      x: containerRef.current.clientWidth / 2,
      y: containerRef.current.clientHeight / 2,
      k: 1,
    };
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-2xl overflow-hidden border transition-all ${
        isFullScreen ? 'fixed inset-0 z-50 rounded-none border-0' : 'h-[620px]'
      }`}
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
        borderColor: 'var(--border)',
        boxShadow: '0 12px 40px rgba(15, 23, 42, 0.4)',
      }}
    >
      {/* Top Filter & Search Controls Overlay */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Search & Subject filter */}
        <div className="flex items-center gap-2 pointer-events-auto flex-wrap">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search graph nodes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs outline-none transition-all"
              style={{
                background: 'rgba(30, 41, 59, 0.85)',
                border: '1px solid rgba(148, 163, 184, 0.25)',
                color: '#f8fafc',
                backdropFilter: 'blur(12px)',
              }}
            />
          </div>

          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs outline-none"
            style={{
              background: 'rgba(30, 41, 59, 0.85)',
              border: '1px solid rgba(148, 163, 184, 0.25)',
              color: '#f8fafc',
              backdropFilter: 'blur(12px)',
            }}
          >
            <option value="all">All Subjects</option>
            {subjects.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs outline-none"
            style={{
              background: 'rgba(30, 41, 59, 0.85)',
              border: '1px solid rgba(148, 163, 184, 0.25)',
              color: '#f8fafc',
              backdropFilter: 'blur(12px)',
            }}
          >
            <option value="all">All Material Types</option>
            {contentTypes.map(t => (
              <option key={t} value={t}>{t.toUpperCase()}</option>
            ))}
          </select>
        </div>

        {/* Zoom & Fullscreen buttons */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            onClick={() => handleZoom(1.2)}
            title="Zoom In"
            className="p-2 rounded-xl text-slate-300 hover:text-white transition-colors"
            style={{ background: 'rgba(30, 41, 59, 0.85)', border: '1px solid rgba(148, 163, 184, 0.25)' }}
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleZoom(0.8)}
            title="Zoom Out"
            className="p-2 rounded-xl text-slate-300 hover:text-white transition-colors"
            style={{ background: 'rgba(30, 41, 59, 0.85)', border: '1px solid rgba(148, 163, 184, 0.25)' }}
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetZoom}
            title="Reset View"
            className="p-2 rounded-xl text-slate-300 hover:text-white transition-colors"
            style={{ background: 'rgba(30, 41, 59, 0.85)', border: '1px solid rgba(148, 163, 184, 0.25)' }}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            title={isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
            className="p-2 rounded-xl text-slate-300 hover:text-white transition-colors ml-1"
            style={{ background: 'rgba(30, 41, 59, 0.85)', border: '1px solid rgba(148, 163, 184, 0.25)' }}
          >
            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Canvas */}
      <canvas ref={canvasRef} className="w-full h-full block cursor-grab active:cursor-grabbing" />

      {/* Bottom Legend Overlay */}
      <div className="absolute bottom-4 left-4 z-20 pointer-events-none">
        <div
          className="px-4 py-2.5 rounded-xl flex items-center gap-4 text-xs font-semibold text-slate-300 pointer-events-auto"
          style={{
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-indigo-500 shadow-sm" />
            <span>Root</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-purple-500 shadow-sm" />
            <span>Subject</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-pink-500 shadow-sm" />
            <span>Topic</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm" />
            <span>AI Processed Note</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500 animate-pulse shadow-sm" />
            <span>Revision Due</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-cyan-500 shadow-sm" />
            <span>Question Concept</span>
          </div>
        </div>
      </div>

      {/* Selected Node Drawer Card */}
      {selectedNode && (
        <div
          className="absolute bottom-4 right-4 z-30 w-80 rounded-2xl p-5 border text-white space-y-3 animate-fade-in"
          style={{
            background: 'rgba(15, 23, 42, 0.92)',
            borderColor: selectedNode.color,
            boxShadow: `0 12px 32px rgba(0,0,0,0.5), 0 0 0 1px ${selectedNode.color}44`,
            backdropFilter: 'blur(16px)',
          }}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: selectedNode.color }}
              />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {selectedNode.type}
              </span>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-slate-400 hover:text-white text-xs font-bold px-1.5 py-0.5 rounded"
            >
              ✕
            </button>
          </div>

          <div>
            <h4 className="font-bold text-base line-clamp-2">
              {selectedNode.full_title || selectedNode.full_question || selectedNode.label}
            </h4>
            {selectedNode.subject && (
              <p className="text-xs text-indigo-300 font-semibold mt-1">
                {selectedNode.subject} {selectedNode.topic ? `› ${selectedNode.topic}` : ''}
              </p>
            )}
          </div>

          {selectedNode.type === 'note' && selectedNode.note_id && (
            <div className="pt-2 flex items-center gap-2">
              <Link
                href={`/notes/${selectedNode.note_id}`}
                className="w-full text-center py-2 rounded-xl text-xs font-bold transition-all text-white"
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  boxShadow: '0 4px 12px rgba(99,102,241,0.4)',
                }}
              >
                Open Note & Study →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function adjustColor(color: string, amount: number) {
  let usePound = false;
  if (color[0] === '#') {
    color = color.slice(1);
    usePound = true;
  }
  const num = parseInt(color, 16);
  if (isNaN(num)) return color;

  let r = (num >> 16) + amount;
  if (r > 255) r = 255;
  else if (r < 0) r = 0;

  let b = ((num >> 8) & 0x00ff) + amount;
  if (b > 255) b = 255;
  else if (b < 0) b = 0;

  let g = (num & 0x0000ff) + amount;
  if (g > 255) g = 255;
  else if (g < 0) g = 0;

  return (usePound ? '#' : '') + (g | (b << 8) | (r << 16)).toString(16).padStart(6, '0');
}
