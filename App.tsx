
import React, { useState, useRef, useEffect } from 'react';
import { LetterData, Student, AppStatus } from './types';
import { Plus, Trash2, FileText, Download, CheckCircle2, AlertCircle, Loader2, RefreshCw, ExternalLink, CloudUpload } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const App: React.FC = () => {
  const [sequence, setSequence] = useState<number>(() => {
    const saved = localStorage.getItem('sksa_ref_sequence');
    return saved ? parseInt(saved, 10) : 1;
  });

  const getInitialDate = () => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  };

  const [data, setData] = useState<LetterData>({
    rujukan: sequence.toString(),
    tarikh: getInitialDate(),
    namaSekAgama: '',
    namaProgram: '',
    tarikhProgram: '',
    hariProgram: '',
    students: [{ id: '1', name: '', class: '' }]
  });

  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const page1Ref = useRef<HTMLDivElement>(null);
  const page2Ref = useRef<HTMLDivElement>(null);
  
  const DRIVE_LINK = "https://drive.google.com/drive/folders/1F93DQWvLux858nB2kM8lSxKtJTNvdIgy?usp=drive_link";
  const LOGO_SKSA = "https://i.postimg.cc/rmdkLmLv/logo-sksa-1.jpg";

  useEffect(() => {
    setData(prev => ({ ...prev, rujukan: sequence.toString() }));
    localStorage.setItem('sksa_ref_sequence', sequence.toString());
  }, [sequence]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setData(prev => {
      const newData = { ...prev, [name]: value };
      if (name === 'tarikhProgram') {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          const days = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];
          newData.hariProgram = days[date.getDay()];
        }
      }
      return newData;
    });
  };

  const formatDateMalay = (dateStr: string) => {
    if (!dateStr) return '............';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const months = ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const addStudent = () => {
    setData(prev => ({
      ...prev,
      students: [...prev.students, { id: Date.now().toString(), name: '', class: '' }]
    }));
  };

  const removeStudent = (id: string) => {
    setData(prev => ({
      ...prev,
      students: prev.students.length > 1 ? prev.students.filter(s => s.id !== id) : prev.students
    }));
  };

  const updateStudent = (id: string, field: 'name' | 'class', value: string) => {
    setData(prev => ({
      ...prev,
      students: prev.students.map(s => s.id === id ? { ...s, [field]: value } : s)
    }));
  };

  const capturePage = async (ref: React.RefObject<HTMLDivElement>) => {
    if (!ref.current) return null;
    return await html2canvas(ref.current, {
      scale: 3,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      scrollX: 0,
      scrollY: 0,
      width: 800,
      height: 1123,
    });
  };

  const generatePDF = async () => {
    if (!page1Ref.current || !page2Ref.current) return;
    setStatus(AppStatus.GENERATING);
    
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Muka Surat 1
      const canvas1 = await capturePage(page1Ref);
      if (canvas1) {
        const imgData1 = canvas1.toDataURL('image/png');
        pdf.addImage(imgData1, 'PNG', 0, 0, pdfWidth, pdfHeight);
      }

      // Muka Surat 2 (Lampiran)
      pdf.addPage();
      const canvas2 = await capturePage(page2Ref);
      if (canvas2) {
        const imgData2 = canvas2.toDataURL('image/png');
        pdf.addImage(imgData2, 'PNG', 0, 0, pdfWidth, pdfHeight);
      }
      
      pdf.save(`Surat_Pelepasan_SKSA_${data.namaProgram.replace(/\s+/g, '_') || 'Rasmi'}.pdf`);
      
      setStatus(AppStatus.UPLOADING);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSequence(prev => prev + 1);
      setStatus(AppStatus.SUCCESS);
      setTimeout(() => setStatus(AppStatus.IDLE), 3000);
    } catch (error) {
      console.error("PDF Export Error:", error);
      setStatus(AppStatus.ERROR);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-2 md:p-6 lg:p-10">
      <header className="max-w-[1400px] mx-auto mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b-2 border-slate-200 pb-6">
        <div className="flex items-center gap-5 justify-center md:justify-start">
          <img src={LOGO_SKSA} alt="Logo SKSA" className="w-20 h-20 object-contain rounded-2xl shadow-lg border-2 border-white" crossOrigin="anonymous" />
          <div className="text-left">
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 leading-none tracking-tight">SISTEM PENJANA SURAT</h1>
            <p className="text-blue-700 font-black uppercase text-base md:text-xl tracking-tighter mt-1">SK SG ABONG, MUAR</p>
          </div>
        </div>
        <div className="flex justify-center">
          <a href={DRIVE_LINK} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-slate-700 hover:text-blue-600 font-bold transition bg-white px-6 py-3 rounded-2xl border border-slate-200 shadow-sm text-sm uppercase tracking-widest hover:shadow-md">
            <ExternalLink size={18} /> Buka Folder Drive
          </a>
        </div>
      </header>

      <main className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* INPUT FORM */}
        <section className="lg:col-span-5 bg-white p-8 rounded-[2rem] shadow-2xl border border-slate-200">
          <div className="mb-8">
            <h2 className="text-base font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-3">
               <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"></div> Borang Maklumat Utama
            </h2>
            <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">Sila isi semua ruangan dengan teliti</p>
          </div>
          
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase tracking-wider">No. Rujukan</label>
                <div className="flex gap-2">
                   <input type="text" name="rujukan" value={data.rujukan} onChange={handleInputChange} className="w-full px-4 py-3.5 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none bg-slate-50 font-mono text-slate-900 font-bold text-sm shadow-sm" />
                   <button onClick={() => setSequence(1)} title="Reset Sequence" className="px-4 bg-slate-50 rounded-2xl text-slate-400 hover:text-red-500 transition border-2 border-slate-100 hover:border-red-100 shadow-sm"><RefreshCw size={18} /></button>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase tracking-wider">Tarikh Surat</label>
                <input type="date" name="tarikh" value={data.tarikh} onChange={handleInputChange} className="w-full px-4 py-3.5 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none bg-slate-50 text-sm font-bold text-slate-900 shadow-sm" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase tracking-wider">Nama Sekolah Agama Penerima</label>
              <input type="text" name="namaSekAgama" value={data.namaSekAgama} onChange={handleInputChange} placeholder="Contoh: Parit Kadhi / Sri Jong / Parit Setongkat" className="w-full px-5 py-4 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none bg-slate-50 text-sm font-bold text-slate-900 shadow-sm" />
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase tracking-wider">Nama Program / Acara</label>
              <input type="text" name="namaProgram" value={data.namaProgram} onChange={handleInputChange} placeholder="Contoh: Kejohanan Olahraga MSSD Muar" className="w-full px-5 py-4 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none bg-slate-50 text-sm font-bold text-slate-900 shadow-sm" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase tracking-wider">Tarikh Program</label>
                <input type="date" name="tarikhProgram" value={data.tarikhProgram} onChange={handleInputChange} className="w-full px-4 py-3.5 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none bg-slate-50 text-sm font-bold text-slate-900 shadow-sm" />
              </div>
              <div>
                <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase tracking-wider">Hari</label>
                <input type="text" name="hariProgram" value={data.hariProgram} readOnly className="w-full px-4 py-3.5 border-2 border-slate-100 rounded-2xl bg-slate-200/50 outline-none font-black text-slate-600 text-sm shadow-sm" />
              </div>
            </div>

            <div className="pt-6 border-t-2 border-slate-50">
              <div className="flex items-center justify-between mb-5">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Senarai Murid Terlibat</label>
                <button onClick={addStudent} className="text-[11px] bg-slate-900 text-white px-5 py-2.5 rounded-full hover:bg-blue-600 font-bold transition flex items-center gap-2 shadow-xl active:scale-95">
                  <Plus size={14} /> Tambah Murid
                </button>
              </div>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {data.students.map((student, index) => (
                  <div key={student.id} className="flex gap-3 items-center bg-slate-50/50 p-3 rounded-2xl border border-slate-100 group hover:border-blue-200 hover:bg-white transition shadow-sm">
                    <span className="text-slate-300 font-black text-xs w-6 text-center">{index + 1}</span>
                    <input type="text" placeholder="NAMA PENUH" value={student.name} onChange={(e) => updateStudent(student.id, 'name', e.target.value)} className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs uppercase font-bold outline-none focus:border-blue-400 text-slate-900" />
                    <input type="text" placeholder="KELAS" value={student.class} onChange={(e) => updateStudent(student.id, 'class', e.target.value)} className="w-28 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-center font-bold outline-none focus:border-blue-400 text-slate-900" />
                    <button onClick={() => removeStudent(student.id)} className="p-2 text-slate-300 hover:text-red-500 transition"><Trash2 size={20} /></button>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4">
                <button 
                    onClick={generatePDF}
                    disabled={status !== AppStatus.IDLE}
                    className="w-full bg-blue-600 text-white py-5 rounded-[1.5rem] font-black text-lg flex flex-col items-center justify-center gap-1 hover:bg-blue-700 transition shadow-2xl shadow-blue-200 active:scale-95 disabled:opacity-50 disabled:scale-100"
                >
                  {status === AppStatus.GENERATING ? (
                    <><Loader2 className="animate-spin" size={28} /> <span className="text-[10px] uppercase tracking-widest mt-2">Menyusun Dokumen PDF...</span></>
                  ) : status === AppStatus.UPLOADING ? (
                    <><CloudUpload className="animate-bounce" size={28} /> <span className="text-[10px] uppercase tracking-widest mt-2">Merekod Data...</span></>
                  ) : status === AppStatus.SUCCESS ? (
                    <><CheckCircle2 size={28} /> <span className="text-[10px] uppercase tracking-widest mt-2">Selesai & Muat Turun</span></>
                  ) : (
                    <><Download size={30} /> <span className="text-sm font-bold uppercase tracking-[0.15em]">JANA SURAT PELEPASAN</span></>
                  )}
                </button>
            </div>
          </div>
        </section>

        {/* PREVIEW SECTION */}
        <section className="lg:col-span-7 space-y-12 flex flex-col items-center pb-24 overflow-x-auto">
          <div className="w-full text-center flex items-center justify-center gap-6">
            <div className="h-[2px] bg-slate-200 flex-1"></div>
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.8em]">Pratonton Dokumen Rasmi</span>
            <div className="h-[2px] bg-slate-200 flex-1"></div>
          </div>

          {/* PAGE 1: SURAT */}
          <div className="w-full bg-slate-300/40 p-4 md:p-10 rounded-[3rem] shadow-inner flex flex-col items-center gap-6">
            <span className="bg-white px-6 py-1.5 rounded-full text-[10px] font-black text-slate-500 shadow-sm border border-slate-100 uppercase tracking-widest">Muka Surat 1 (Surat Pelepasan)</span>
            <div 
              ref={page1Ref}
              id="letter-page-1"
              className="p-[1.5cm] text-[12pt] leading-[1.4] bg-white text-black min-h-[1123px] w-[800px] shadow-2xl relative"
              style={{ fontFamily: 'Times New Roman, serif' }}
            >
                {/* Header Rasmi SKSA */}
                <div className="flex items-center border-b-[2.5px] border-black pb-4 mb-8">
                  <div className="w-28 h-28 mr-6 flex items-center justify-center">
                    <img src="https://i.postimg.cc/QdYFhFTm/logo-kpm-(3).jpg" alt="Logo KPM" className="w-full h-full object-contain" crossOrigin="anonymous" />
                  </div>
                  <div className="flex-1 leading-[1.15]">
                    <div className="text-[11pt] font-bold uppercase mb-0.5 tracking-tight">SEKOLAH KEBANGSAAN SUNGAI ABONG (JBA 5095)</div>
                    <div className="text-[10pt]">Jalan Sungai Abong <span className="float-right font-medium">Tel : 06 - 9549634</span></div>
                    <div className="text-[10pt]">84000 Muar <span className="float-right font-medium">Kod Sekolah : JBA5095</span></div>
                    <div className="text-[10pt]">Johor Darul Takzim <span className="float-right font-medium text-[9pt]">E-mel : jba5095@moe.edu.my</span></div>
                  </div>
                </div>

                <div className="flex justify-end mb-10">
                  <div className="text-right text-[11pt]">
                    <div className="font-medium">Rujukan Kami : 600/3/1/{data.rujukan || '............'}</div>
                    <div className="font-medium">Tarikh : {formatDateMalay(data.tarikh)}</div>
                  </div>
                </div>

                <div className="mb-8 text-[12pt]">
                  Guru Besar<br />
                  Sekolah Agama {data.namaSekAgama || '...........................................'},<br /><br />
                  Tuan/Puan,<br /><br />
                  <div className="font-bold uppercase underline decoration-1 underline-offset-[4px] text-[11.5pt]">
                    MEMOHON KEBENARAN PELEPASAN MURID UNTUK {data.namaProgram || '...........................................'}
                  </div>
                </div>

                <div className="mb-5 text-justify">Dengan segala hormatnya perkara di atas adalah dirujuk.</div>
                <div className="mb-5 text-justify">
                  2. &nbsp;&nbsp; Untuk makluman pihak tuan / puan, murid seperti dalam lampiran terlibat dengan <span className="font-bold">{data.namaProgram || '...........................................'}</span> yang akan diadakan mengikut ketetapan berikut:
                </div>
                
                <div className="ml-14 mb-8 grid grid-cols-[100px_auto] gap-y-1 text-[11pt]">
                  <div className="font-bold">Tarikh</div>: {formatDateMalay(data.tarikhProgram)}
                  <div className="font-bold">Hari</div>: {data.hariProgram || '.....................'}
                </div>

                <div className="mb-5 text-justify">
                  3. &nbsp;&nbsp; Sehubungan dengan itu, pihak sekolah ingin memohon jasa baik pihak tuan / puan memberi pelepasan kepada murid terlibat untuk menghadiri program tersebut.
                </div>

                <div className="mb-10 text-justify text-[11pt]">
                  4. &nbsp;&nbsp; Kerjasama dan sokongan tuan / puan amat kami hargai. Dilampirkan bersama-sama surat ini senarai nama murid yang terlibat untuk makluman tuan / puan selanjutnya. Sebarang pertanyaan boleh menghubungi Pn Zuriana bt Kamarudin, GPK Kokurikulum di talian 069549634.
                </div>

                <div className="mb-12">
                  Sekian, terima kasih.<br /><br />
                  <div className="font-bold mb-0.5 text-[11pt]">“MALAYSIA MADANI”</div>
                  <div className="font-bold mb-6 text-[11pt]">“BERKHIDMAT UNTUK NEGARA”</div>
                  
                  Saya yang menjalankan amanah,<br /><br />
                  <div className="mb-1 h-14">
                    <img src="https://i.postimg.cc/ZRtpzWGV/TANDA-TANGAN-GB.png" alt="Signature" className="w-24 h-14 object-contain ml-4" crossOrigin="anonymous" />
                  </div>
                  <div className="font-bold uppercase mt-1 text-[11.5pt]">(SITI ZALEHA BINTI RAMLAN)</div>
                  <div className="leading-tight text-[11pt]">
                    Guru Besar,<br />
                    Sekolah Kebangsaan Sungai Abong.
                  </div>
                </div>
            </div>
          </div>

          {/* PAGE 2: LAMPIRAN */}
          <div className="w-full bg-slate-300/40 p-4 md:p-10 rounded-[3rem] shadow-inner flex flex-col items-center gap-6">
            <span className="bg-white px-6 py-1.5 rounded-full text-[10px] font-black text-slate-500 shadow-sm border border-slate-100 uppercase tracking-widest">Muka Surat 2 (Lampiran Nama Murid)</span>
            <div 
              ref={page2Ref}
              id="letter-page-2"
              className="p-[1.5cm] text-[12pt] leading-[1.4] bg-white text-black min-h-[1123px] w-[800px] shadow-2xl relative"
              style={{ fontFamily: 'Times New Roman, serif' }}
            >
                <div className="text-center mb-10 pt-12">
                   <div className="font-bold underline text-[14pt] uppercase mb-2">LAMPIRAN</div>
                   <div className="font-bold text-[12pt] uppercase tracking-wide">SENARAI NAMA MURID TERLIBAT</div>
                   <div className="text-[11pt] uppercase mt-2 px-12 border-b border-dashed border-slate-200 pb-4">{data.namaProgram || '...........................................'}</div>
                </div>

                <table className="w-full border-collapse border-[2px] border-black text-[11.5pt]">
                   <thead>
                     <tr className="bg-slate-50">
                       <th className="border-[1.5px] border-black px-3 py-4 w-16 text-center font-bold">BIL</th>
                       <th className="border-[1.5px] border-black px-5 py-4 text-left uppercase font-bold">NAMA PENUH MURID</th>
                       <th className="border-[1.5px] border-black px-5 py-4 w-40 text-center font-bold">KELAS</th>
                     </tr>
                   </thead>
                   <tbody>
                     {data.students.map((s, i) => (
                       <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                         <td className="border-[1.5px] border-black px-3 py-4 text-center font-bold">{i + 1}</td>
                         <td className="border-[1.5px] border-black px-5 py-4 uppercase font-medium">{s.name || '.........................................................'}</td>
                         <td className="border-[1.5px] border-black px-5 py-4 text-center uppercase font-bold">{s.class || '.........'}</td>
                       </tr>
                     ))}
                     {data.students.length < 10 && Array.from({ length: 10 - data.students.length }).map((_, idx) => (
                       <tr key={`empty-${idx}`}>
                         <td className="border-[1.5px] border-black px-3 py-5"></td>
                         <td className="border-[1.5px] border-black px-5 py-5"></td>
                         <td className="border-[1.5px] border-black px-5 py-5"></td>
                       </tr>
                     ))}
                   </tbody>
                </table>

                <div className="mt-14 text-[10.5pt] italic text-slate-500 font-medium">
                   * Senarai ini adalah sebahagian daripada surat rujukan 600/3/1/{data.rujukan || '....'} bertarikh {formatDateMalay(data.tarikh)}.
                </div>
                
                <div className="absolute bottom-12 left-[1.5cm] right-[1.5cm] border-t-2 border-slate-100 pt-6 flex justify-between items-center text-[10px] text-slate-400 font-black uppercase tracking-widest">
                   <div className="flex items-center gap-3">
                      <img src={LOGO_SKSA} alt="Logo Small" className="w-5 h-5 grayscale opacity-40" crossOrigin="anonymous" />
                      <span>Unit Kokurikulum SKSA</span>
                   </div>
                   <span>Dokumen Rasmi • Muka Surat 2/2</span>
                </div>
             </div>
          </div>
        </section>
      </main>
      
      <footer className="mt-12 mb-16 text-center">
         <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.6em]">Automasi Dokumen Rasmi SKSA • v2.6 stable</p>
         <p className="text-[9px] text-slate-300 font-bold mt-2">Disediakan untuk kemudahan Guru-Guru SK Sungai Abong</p>
      </footer>
    </div>
  );
};

export default App;
