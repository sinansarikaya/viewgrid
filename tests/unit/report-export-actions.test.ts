// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { buildLocalResult } from '../../src/core/analysis/local-engine';
import type { AnalysisBatch } from '../../src/core/analysis/schema';
import { ReportExportActions, REPORT_FEEDBACK_MS } from '../../src/ui/workspace/ReportExportActions';
const data = buildLocalResult({ requestedUrl: 'https://example.com/', finalUrl: 'https://example.com/', profile: 'mobile', locale: 'en', width:393, height:852, durationMs:1, fcpMs:100, snapshot: { elements: [], truncated:false }, axeAudits:[] });
const batch: AnalysisBatch = { schemaVersion:1, requestId:'report', requestedUrl:'https://example.com/', profileSelection:'mobile', startedAt:'2026-10-14T10:00:00Z', completedAt:'2026-10-14T10:00:01Z', results:[{profile:'mobile',status:'success',data,error:null}] };
let host: HTMLDivElement, root: ReturnType<typeof createRoot>;
const writeText = vi.fn();
const createObjectURL = vi.fn(), revokeObjectURL = vi.fn();
beforeEach(() => {
  vi.useFakeTimers(); vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true);
  vi.stubGlobal('navigator',{ clipboard:{writeText} });
  const OriginalURL=URL;
  vi.stubGlobal('URL',class extends OriginalURL { static createObjectURL=createObjectURL; static revokeObjectURL=revokeObjectURL; });
  host=document.createElement('div');document.body.appendChild(host);root=createRoot(host);
  writeText.mockReset().mockResolvedValue(undefined);createObjectURL.mockReset().mockReturnValue('blob:report');revokeObjectURL.mockReset();
});
afterEach(() => { act(()=>root.unmount());host.remove();vi.clearAllTimers();vi.useRealTimers();vi.restoreAllMocks();vi.unstubAllGlobals(); });
async function render(section: 'seo'|'geo'='seo') { await act(async()=>root.render(React.createElement(ReportExportActions,{key:section,batch,version:'1.0.3',language:'en',section,disabled:false}))); }
const button=(name:string)=>host.querySelector<HTMLButtonElement>('button[aria-label="'+name+'"]')!;
it('confirms only the copied report in green and fades the message away without dismissal',async()=>{
  await render();await act(async()=>button('Copy Report').click());
  expect(writeText).toHaveBeenCalledOnce();expect(writeText.mock.calls[0]![0]).toContain('SEO / Accessibility');
  expect(button('Copy Report').getAttribute('data-confirmed')).toBe('true');
  expect(host.querySelector('[data-kind="success"]')!.textContent).toContain('SEO & Accessibility report copied');
  expect(host.querySelector('[role="alert"]')).toBeNull();
  act(()=>vi.advanceTimersByTime(REPORT_FEEDBACK_MS));
  expect(button('Copy Report').hasAttribute('data-confirmed')).toBe(false);
  expect(host.querySelector('[data-state="closing"]')).not.toBeNull();
  act(()=>vi.advanceTimersByTime(180));expect(host.querySelector('[data-kind="success"]')).toBeNull();
});
it('does not let a late clipboard operation notify a newly selected section',async()=>{
  let resolve!:()=>void;writeText.mockReturnValue(new Promise<void>(done=>{resolve=done;}));
  await render();act(()=>button('Copy Report').click());expect(button('Copy Report').disabled).toBe(true);
  await render('geo');await act(async()=>resolve());
  expect(host.textContent).not.toContain('report copied');expect(button('Copy Report').hasAttribute('data-confirmed')).toBe(false);
});
it('reports actual clipboard failure locally and keeps download available',async()=>{
  writeText.mockRejectedValue(new Error('private implementation details'));
  await render();await act(async()=>button('Copy Report').click());
  expect(host.querySelector('[role="alert"]')!.textContent).toContain('Copy failed');
  expect(host.textContent).not.toContain('private implementation');expect(button('Download Markdown').disabled).toBe(false);
  expect(button('Copy Report').hasAttribute('data-confirmed')).toBe(false);
});
it('starts a scoped file download and releases its object URL after the browser can consume it',async()=>{
  const names:string[]=[];vi.spyOn(HTMLAnchorElement.prototype,'click').mockImplementation(function(this: HTMLAnchorElement){names.push(this.download);});
  await render();act(()=>button('Download Markdown').click());
  expect(names).toEqual(['viewgrid-seo-report.md']);expect(createObjectURL.mock.calls[0]![0].type).toBe('text/markdown;charset=utf-8');
  expect(host.textContent).toContain('SEO & Accessibility report download started');expect(revokeObjectURL).not.toHaveBeenCalled();
  act(()=>vi.advanceTimersByTime(1000));expect(revokeObjectURL).toHaveBeenCalledWith('blob:report');
});
it('suppresses an old copy when the report is disabled and reopened before the clipboard responds',async()=>{
  let resolve!:()=>void;writeText.mockReturnValue(new Promise<void>(done=>{resolve=done;}));
  await render();act(()=>button('Copy Report').click());
  await act(async()=>root.render(React.createElement(ReportExportActions,{key:'seo',batch,version:'1.0.3',language:'en',section:'seo',disabled:true})));
  await render();await act(async()=>resolve());
  expect(host.textContent).not.toContain('report copied');expect(button('Copy Report').getAttribute('data-confirmed')).toBeNull();
});
