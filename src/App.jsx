import { useState, useEffect } from 'react'
import './App.css'

function App() {
  // Paths
  const [paths, setPaths] = useState({ source_dir: '', output_path: '' })
  const [filesStatus, setFilesStatus] = useState({})
  
  // App states
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [activeTab, setActiveTab] = useState('S1')
  const [activeResultTab, setActiveResultTab] = useState('S1')
  const [selectedClass, setSelectedClass] = useState('A')
  
  // Grouping configs
  const [config, setConfig] = useState({
    s1_top_count: 35,
    s1_top_class: '1A',
    s1_other_pattern: 'gender_snake',
    s2_top_count: 34,
    s2_top_class: '2A',
    s2_repeater_placement: 'previous',
    s3_top_count: 35,
    s3_top_class: '3A',
    s4_x3_class: '4D',
    s4_x3_top_count: 33,
    s4_4c_size: 31,
  })

  // Data loaded from server
  const [repeaters, setRepeaters] = useState([])
  const [relations, setRelations] = useState([])
  const [manualPlacements, setManualPlacements] = useState({})
  
  // Results
  const [results, setResults] = useState(null)
  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState('info') // 'info', 'success', 'error'

  useEffect(() => {
    fetchPaths()
  }, [])

  const fetchPaths = async () => {
    try {
      const res = await fetch('/api/paths')
      const data = await res.json()
      setPaths(data)
      if (data.source_dir) {
        checkFilesStatus()
      }
    } catch (e) {
      console.error(e)
    }
  }

  const checkFilesStatus = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/load_source_status')
      const data = await res.json()
      if (data.status === 'error') {
        showMsg(data.message, 'error')
      } else {
        setFilesStatus(data)
        loadInitialData()
      }
    } catch (e) {
      showMsg('載入檔案狀態失敗，請確認後台伺服器是否運行。', 'error')
    }
    setLoading(false)
  }

  const loadInitialData = async () => {
    try {
      const res = await fetch('/api/load_initial_data')
      const data = await res.json()
      if (data.status === 'error') {
        showMsg(data.message, 'error')
      } else {
        setRepeaters(data.repeaters)
        setRelations(data.relations)
        // Set default manual placements map
        const initialPlacements = {}
        data.repeaters.forEach(rep => {
          initialPlacements[rep.name] = 'Auto'
        })
        setManualPlacements(initialPlacements)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const showMsg = (text, type = 'info') => {
    setMsg(text)
    setMsgType(type)
    setTimeout(() => {
      setMsg('')
    }, 6000)
  }

  const handleSelectFolder = async () => {
    try {
      const res = await fetch('/api/select_folder', { method: 'POST' })
      const data = await res.json()
      if (data.status === 'success') {
        setPaths({ source_dir: data.source_dir, output_path: data.output_path })
        checkFilesStatus()
      }
    } catch (e) {
      showMsg('選擇目錄出錯', 'error')
    }
  }

  const handleSelectOutput = async () => {
    try {
      const res = await fetch('/api/select_output', { method: 'POST' })
      const data = await res.json()
      if (data.status === 'success') {
        setPaths(prev => ({ ...prev, output_path: data.output_path }))
      }
    } catch (e) {
      showMsg('選擇儲存路徑出錯', 'error')
    }
  }

  const handleConfigChange = (name, val) => {
    setConfig(prev => ({ ...prev, [name]: val }))
  }

  const handleManualPlacementChange = (name, cls) => {
    setManualPlacements(prev => ({ ...prev, [name]: cls }))
  }

  const runSorting = async () => {
    setProcessing(true)
    // Build manual placements (only send classes other than 'Auto')
    const finalPlacements = {}
    Object.entries(manualPlacements).forEach(([name, cls]) => {
      if (cls !== 'Auto') {
        finalPlacements[name] = cls
      }
    })

    try {
      const res = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config,
          manual_placements: finalPlacements
        })
      })
      const data = await res.json()
      if (data.status === 'success') {
        setResults(data.stats)
        showMsg(data.message, 'success')
      } else {
        showMsg(data.message, 'error')
      }
    } catch (e) {
      showMsg('分班處理失敗，請檢查後台伺服器。', 'error')
    }
    setProcessing(false)
  }

  // Check relationship violations
  const getViolations = () => {
    if (!results) return []
    const violations = []
    
    // Map of name -> placed class
    const studentClassMap = {}
    Object.entries(results).forEach(([grade, classes]) => {
      Object.entries(classes).forEach(([clsName, info]) => {
        info.students.forEach(s => {
          studentClassMap[s['中文姓名']] = clsName
        })
      })
    })

    relations.forEach(rel => {
      const c1 = studentClassMap[rel.student1]
      const c2 = studentClassMap[rel.student2]
      if (c1 && c2 && c1 === c2) {
        violations.append({
          ...rel,
          class: c1
        })
      }
    })
    return violations
  }

  const violationsList = getViolations()

  return (
    <div className="container">
      {/* Background blobs */}
      <div className="bg-blob blob-1"></div>
      <div className="bg-blob blob-2"></div>
      
      <header>
        <div className="logo-area">
          <div className="logo-icon">📊</div>
          <div>
            <h1>基智中學分班分組決策系統</h1>
            <p className="subtitle">School Class Assignment & Grouping Decision System</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={handleSelectFolder}>📁 選擇工作目錄</button>
        </div>
      </header>

      {msg && (
        <div className={`alert alert-${msgType}`}>
          <span className="alert-icon">
            {msgType === 'success' ? '✅' : msgType === 'error' ? '❌' : 'ℹ️'}
          </span>
          <span className="alert-text">{msg}</span>
        </div>
      )}

      {/* Path Display Section */}
      <section className="card path-card">
        <h2>工作路徑設定</h2>
        <div className="path-row">
          <div className="path-field">
            <span className="label">來源與學年主目錄:</span>
            <span className="value">{paths.source_dir || '未選擇目錄...'}</span>
          </div>
          <div className="path-field">
            <span className="label">輸出 Excel 檔案路徑:</span>
            <span className="value">{paths.output_path || '未設定路徑...'}</span>
            <button className="btn-mini" onClick={handleSelectOutput}>🖋️ 更改路徑</button>
          </div>
        </div>
      </section>

      <div className="main-layout">
        {/* Left Side: Setup & Config */}
        <div className="config-side">
          {/* File Status Card */}
          <section className="card files-card">
            <h2>來源檔案檢索狀態</h2>
            <div className="files-grid">
              {Object.entries(filesStatus).map(([key, stat]) => (
                <div key={key} className={`file-item ${stat.resolved ? 'resolved' : 'missing'}`}>
                  <span className="status-indicator">{stat.resolved ? '✓' : '✗'}</span>
                  <div className="file-info">
                    <span className="file-key">{
                      key === 'student_list' ? '1. 全校分班分組 (上學年)' :
                      key === 'annual_results' ? '2. 年終成績檔' :
                      key === 'promotion_list' ? '4. 升留人數及名單' :
                      key === 'different_class' ? '6. SEN不同班建議' :
                      key === 'at_marks' ? '7. 中一學前AT成績' :
                      key === 'electives' ? '8. 中四選科及中五重讀' : key
                    }</span>
                    <span className="file-name" title={stat.path}>{stat.filename}</span>
                  </div>
                </div>
              ))}
            </div>
            {Object.keys(filesStatus).length === 0 && (
              <p className="no-data">請選擇包含 source 資料夾的學年主目錄以檢索檔案。</p>
            )}
          </section>

          {/* Grouping Constraints Tabs */}
          <section className="card tabs-card">
            <h2>分班規則與參數設定</h2>
            <div className="tabs">
              {['S1', 'S2', 'S3', 'S4', 'S5', 'S6'].map(t => (
                <button 
                  key={t} 
                  className={`tab-btn ${activeTab === t ? 'active' : ''}`}
                  onClick={() => setActiveTab(t)}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="tab-content">
              {activeTab === 'S1' && (
                <div className="form-grid">
                  <div className="form-group">
                    <label>精英班 (1A) 人數限制</label>
                    <input 
                      type="number" 
                      value={config.s1_top_count} 
                      onChange={e => handleConfigChange('s1_top_count', e.target.value)} 
                    />
                  </div>
                  <div className="form-group">
                    <label>其餘班別分配模式</label>
                    <select 
                      value={config.s1_other_pattern} 
                      onChange={e => handleConfigChange('s1_other_pattern', e.target.value)}
                    >
                      <option value="gender_snake">男女分組蛇形分班 (男女均勻 + 學分均勻)</option>
                      <option value="cyclic">依學分排名循環分班 (1B, 1C, 1D...)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>社別 (紅黃藍綠) 分配</label>
                    <select disabled>
                      <option>註冊編號順序循環分配 (預設紅-{'>'}黃-{'>'}藍-{'>'}綠)</option>
                    </select>
                  </div>
                </div>
              )}

              {activeTab === 'S2' && (
                <div className="form-grid">
                  <div className="form-group">
                    <label>精英班 (2A) 人數限制</label>
                    <input 
                      type="number" 
                      value={config.s2_top_count} 
                      onChange={e => handleConfigChange('s2_top_count', e.target.value)} 
                    />
                  </div>
                  <div className="form-group">
                    <label>其餘 S2 學生編班模式</label>
                    <select disabled>
                      <option>按 S1 年終排名 B-{'>'}C-{'>'}D 循環編排 (與 SAMS 升班一致)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>S2 重讀生分配方式</label>
                    <select 
                      value={config.s2_repeater_placement}
                      onChange={e => handleConfigChange('s2_repeater_placement', e.target.value)}
                    >
                      <option value="previous">返回原班別英文字母 (例如 2B 重讀回 2B)</option>
                      <option value="auto">隨機平均編配</option>
                    </select>
                  </div>
                </div>
              )}

              {activeTab === 'S3' && (
                <div className="form-grid">
                  <div className="form-group">
                    <label>精英班 (3A) 人數限制</label>
                    <input 
                      type="number" 
                      value={config.s3_top_count} 
                      onChange={e => handleConfigChange('s3_top_count', e.target.value)} 
                    />
                  </div>
                  <div className="form-group">
                    <label>非 3A 學生編班模式</label>
                    <select disabled>
                      <option>直升班別字母 (例如 2B -{'>'} 3B, 2C -{'>'} 3C)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>原 2A 班級未進 3A 學生</label>
                    <select disabled>
                      <option>自動分配到 3B, 3C, 3D (平衡人數與男女比)</option>
                    </select>
                  </div>
                </div>
              )}

              {activeTab === 'S4' && (
                <div className="form-grid">
                  <div className="form-group">
                    <label>選修 X3 班級名稱</label>
                    <input 
                      type="text" 
                      value={config.s4_x3_class} 
                      onChange={e => handleConfigChange('s4_x3_class', e.target.value)} 
                    />
                  </div>
                  <div className="form-group">
                    <label>X3 (M1/Bio) 收生名次上限 (進入 4D)</label>
                    <input 
                      type="number" 
                      value={config.s4_x3_top_count} 
                      onChange={e => handleConfigChange('s4_x3_top_count', e.target.value)} 
                    />
                  </div>
                  <div className="form-group">
                    <label>4C 班級收生目標人數</label>
                    <input 
                      type="number" 
                      value={config.s4_4c_size} 
                      onChange={e => handleConfigChange('s4_4c_size', e.target.value)} 
                    />
                  </div>
                  <div className="form-group">
                    <label>4C 其餘收生篩選科目</label>
                    <select disabled>
                      <option>中三學年年終成績 (中文 + 生社) 排行榜</option>
                    </select>
                  </div>
                </div>
              )}

              {activeTab === 'S5' && (
                <div className="form-grid">
                  <div className="form-group">
                    <label>S5 升班機制</label>
                    <select disabled>
                      <option>直升班別對應 (4A-{'>'}5A, 4B-{'>'}5B, 4C-{'>'}5C, 4D-{'>'}5D)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>中五重讀生</label>
                    <select disabled>
                      <option>自動抓取中五重讀選科表並編配選修科</option>
                    </select>
                  </div>
                </div>
              )}

              {activeTab === 'S6' && (
                <div className="form-grid">
                  <div className="form-group">
                    <label>S6 升班機制</label>
                    <select disabled>
                      <option>直升班別對應 (5A-{'>'}6A, 5B-{'>'}6B, 5C-{'>'}6C, 5D-{'>'}6D)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Repeaters Manual Placement Card */}
          <section className="card rep-card">
            <h2>重讀生與插班生班級手動編配</h2>
            <p className="panel-desc">在此可以手動覆蓋重讀生的編班。若設為 "Auto" 則依系統規則自動平衡分配。</p>
            {repeaters.length > 0 ? (
              <div className="rep-table-wrapper">
                <table className="interactive-table">
                  <thead>
                    <tr>
                      <th>姓名</th>
                      <th>性別</th>
                      <th>原班級</th>
                      <th>重讀級別</th>
                      <th>手動編配班級</th>
                    </tr>
                  </thead>
                  <tbody>
                    {repeaters.map(rep => (
                      <tr key={rep.name}>
                        <td>{rep.name}</td>
                        <td>{rep.gender || 'M'}</td>
                        <td>{rep.prev_class}</td>
                        <td className="highlight-cell">{rep.grade}</td>
                        <td>
                          <select 
                            className="mini-select"
                            value={manualPlacements[rep.name] || 'Auto'}
                            onChange={e => handleManualPlacementChange(rep.name, e.target.value)}
                          >
                            <option value="Auto">自動平衡 (Auto)</option>
                            <option value={`${rep.grade[-1]}A`}>{rep.grade[-1]}A</option>
                            <option value={`${rep.grade[-1]}B`}>{rep.grade[-1]}B</option>
                            <option value={`${rep.grade[-1]}C`}>{rep.grade[-1]}C</option>
                            <option value={`${rep.grade[-1]}D`}>{rep.grade[-1]}D</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="no-data">暫無重讀生名單，請先載入來源檔案。</p>
            )}
          </section>

          {/* Action Trigger button */}
          <div className="action-row">
            <button 
              className="btn-primary" 
              onClick={runSorting}
              disabled={processing || !paths.source_dir}
            >
              {processing ? '正在執行編班分組與輸出中...' : '🚀 執行分班分組與生成 Excel'}
            </button>
          </div>
        </div>

        {/* Right Side: Results & Dashboard */}
        <div className="results-side">
          {/* Real-time SEN Constraint Warnings */}
          <section className="card warnings-card">
            <h2>分班限制衝突檢查 (SEN/訓輔)</h2>
            {relations.length > 0 ? (
              <div className="warnings-list">
                {relations.map((rel, idx) => {
                  const violated = violationsList.some(v => v.student1 === rel.student1 && v.student2 === rel.student2);
                  return (
                    <div key={idx} className={`warning-item ${violated ? 'violated' : 'safe'}`}>
                      <span className="warning-badge">{violated ? '⚠️ 衝突' : '✓ 安全'}</span>
                      <span className="warning-text">
                        <strong>{rel.student1}</strong> & <strong>{rel.student2}</strong> 建議不同班 
                        {violated && <span className="warning-loc"> (目前都在 {violationsList.find(v => v.student1 === rel.student1 && v.student2 === rel.student2)?.class} 班)</span>}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="no-data">暫無不同班限制設定。</p>
            )}
          </section>

          {/* Sorting Results Dashboard */}
          {results ? (
            <section className="card dashboard-card">
              <h2>編班名單即時看板 (Vite-Preview)</h2>
              
              <div className="dashboard-tabs">
                {['S1', 'S2', 'S3', 'S4', 'S5', 'S6'].map(t => (
                  <button 
                    key={t}
                    className={`tab-btn-dash ${activeResultTab === t ? 'active' : ''}`}
                    onClick={() => setActiveResultTab(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Class stats cards */}
              <div className="class-cards-grid">
                {['A', 'B', 'C', 'D'].map(letter => {
                  const clsName = activeResultTab[-1] + letter;
                  const stat = results[activeResultTab]?.[clsName] || { total: 0, female: 0, male: 0 };
                  return (
                    <div 
                      key={letter} 
                      className={`class-card ${selectedClass === letter ? 'selected' : ''}`}
                      onClick={() => setSelectedClass(letter)}
                    >
                      <h3>{clsName} 班</h3>
                      <div className="class-card-total">{stat.total} <span className="small">人</span></div>
                      <div className="class-card-gender">
                        <span className="gender-f">♀️ {stat.female}</span>
                        <span className="gender-m">♂️ {stat.male}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Placed Students list */}
              <div className="placed-students-list">
                <div className="list-header">
                  <h3>{activeResultTab[-1] + selectedClass} 班 學生名冊</h3>
                  <span className="total-badge">
                    共 {results[activeResultTab]?.[activeResultTab[-1] + selectedClass]?.total || 0} 人
                  </span>
                </div>

                <div className="students-table-wrapper">
                  <table className="students-table">
                    <thead>
                      <tr>
                        <th>班號</th>
                        <th>中文姓名</th>
                        <th>英文姓名</th>
                        <th>性別</th>
                        <th>註冊編號</th>
                        <th>備忘錄</th>
                        <th>快速換班</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(results[activeResultTab]?.[activeResultTab[-1] + selectedClass]?.students || []).map(s => (
                        <tr key={s['學生註冊編號'] || s['中文姓名']}>
                          <td>{s['25-26 班號']}</td>
                          <td className="chinese-name">{s['中文姓名']}</td>
                          <td>{s['英文姓名']}</td>
                          <td>
                            <span className={`gender-tag ${s['性別'] === 'F' ? 'gender-f' : 'gender-m'}`}>
                              {s['性別'] === 'F' ? '女 ♀️' : '男 ♂️'}
                            </span>
                          </td>
                          <td className="code-font">{s['學生註冊編號']}</td>
                          <td><span className="remark-tag">{s['備忘錄'] || '-'}</span></td>
                          <td>
                            <select 
                              className="dash-action-select"
                              value={activeResultTab[-1] + selectedClass}
                              onChange={e => {
                                handleManualPlacementChange(s['中文姓名'], e.target.value);
                                showMsg(`已將 ${s['中文姓名']} 設定編入 ${e.target.value}，請重新執行編班以套用更動。`, 'info');
                              }}
                            >
                              <option value={`${activeResultTab[-1]}A`}>{activeResultTab[-1]}A</option>
                              <option value={`${activeResultTab[-1]}B`}>{activeResultTab[-1]}B</option>
                              <option value={`${activeResultTab[-1]}C`}>{activeResultTab[-1]}C</option>
                              <option value={`${activeResultTab[-1]}D`}>{activeResultTab[-1]}D</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                      {(results[activeResultTab]?.[activeResultTab[-1] + selectedClass]?.students || []).length === 0 && (
                        <tr>
                          <td colSpan="7" className="no-data">此班級目前無學生。</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          ) : (
            <section className="card placeholder-card">
              <div className="placeholder-icon">🎯</div>
              <h3>編班著名看板尚未就緒</h3>
              <p>在左側設定完參數並點擊「執行分班分組」按鈕。系統將自動生成 Excel 並在此處渲染學生分組統計與名單看板。</p>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
