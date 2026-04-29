const express = require("express");
const os = require("os");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

/* =========================
   Funções auxiliares
========================= */
function gb(v) {
  return (v / 1024 / 1024 / 1024).toFixed(2);
}

function percent(part, total) {
  return ((part / total) * 100).toFixed(0);
}

function getIPs() {
  const nets = os.networkInterfaces();
  const list = [];

  for (const name in nets) {
    for (const net of nets[name]) {
      list.push({
        interface: name,
        address: net.address,
        family: net.family,
        mac: net.mac,
        internal: net.internal
      });
    }
  }

  return list;
}

function getFiles() {
  try {
    return fs.readdirSync(".").slice(0, 15);
  } catch {
    return [];
  }
}

function cpuDetails() {
  return os.cpus().map((cpu, index) => ({
    core: index,
    model: cpu.model,
    speed: cpu.speed,
    user: cpu.times.user,
    sys: cpu.times.sys,
    idle: cpu.times.idle
  }));
}

/* =========================
   Rota principal
========================= */
app.get("/", (req, res) => {
  const total = os.totalmem();
  const free = os.freemem();
  const used = total - free;
  const ramPercent = percent(used, total);

  const cpu = os.cpus();
  const cpuInfo = cpuDetails();
  const ips = getIPs();
  const files = getFiles();

  const user = os.userInfo();

  res.send(`
  <html>
  <head>
    <meta http-equiv="refresh" content="5">
    <title>SO Dashboard</title>

    <style>
      body{
        font-family:Arial;
        background:#f0f2f5;
        margin:0;
        padding:20px;
      }

      h1{
        text-align:center;
        margin-bottom:5px;
      }

      .subtitle{
        text-align:center;
        color:#666;
        margin-bottom:20px;
      }

      .grid{
        display:grid;
        grid-template-columns:repeat(auto-fit,minmax(340px,1fr));
        gap:15px;
      }

      .card{
        background:white;
        padding:20px;
        border-radius:14px;
        box-shadow:0 2px 8px rgba(0,0,0,.08);
      }

      .bar{
        background:#ddd;
        height:28px;
        border-radius:8px;
        overflow:hidden;
      }

      .fill{
        background:#4caf50;
        height:100%;
        color:white;
        text-align:center;
        line-height:28px;
        font-weight:bold;
      }

      table{
        width:100%;
        border-collapse:collapse;
        font-size:13px;
      }

      th,td{
        padding:6px;
        border-bottom:1px solid #eee;
        text-align:left;
      }

      pre{
        font-size:12px;
        white-space:pre-wrap;
      }

      small{
        color:#666;
      }
    </style>
  </head>

  <body>

    <h1>🖥️ SO Dashboard Premium</h1>
    <div class="subtitle">
      Atualizado em ${new Date().toLocaleString()}
    </div>

    <div class="grid">

      <!-- Sistema -->
      <div class="card">
        <h2>📌 Sistema</h2>
        <p><b>Host:</b> ${os.hostname()}</p>
        <p><b>SO:</b> ${os.type()}</p>
        <p><b>Release:</b> ${os.release()}</p>
        <p><b>Plataforma:</b> ${os.platform()}</p>
        <p><b>Arquitetura:</b> ${os.arch()}</p>
        <p><b>Endianness:</b> ${os.endianness()}</p>
        <p><b>Node:</b> ${process.version}</p>
      </div>

      <!-- Usuário -->
      <div class="card">
        <h2>👤 Usuário</h2>
        <p><b>Usuário:</b> ${user.username}</p>
        <p><b>Home:</b> ${os.homedir()}</p>
        <p><b>Temp:</b> ${os.tmpdir()}</p>
        <p><b>Shell:</b> ${user.shell || "N/A"}</p>
      </div>

      <!-- RAM -->
      <div class="card">
        <h2>🧠 Memória RAM</h2>
        <p><b>Total:</b> ${gb(total)} GB</p>
        <p><b>Usada:</b> ${gb(used)} GB</p>
        <p><b>Livre:</b> ${gb(free)} GB</p>

        <div class="bar">
          <div class="fill" style="width:${ramPercent}%">
            ${ramPercent}%
          </div>
        </div>
      </div>

      <!-- CPU -->
      <div class="card">
        <h2>⚙️ CPU</h2>
        <p><b>Núcleos:</b> ${cpu.length}</p>
        <p><b>Modelo:</b> ${cpu[0].model}</p>
        <p><b>Clock:</b> ${cpu[0].speed} MHz</p>
        <p><b>Load Avg:</b> ${os.loadavg().map(v => v.toFixed(2)).join(" | ")}</p>

        <table>
          <tr>
            <th>Core</th>
            <th>MHz</th>
            <th>User</th>
            <th>Idle</th>
          </tr>

          ${cpuInfo.map(c => `
            <tr>
              <td>${c.core}</td>
              <td>${c.speed}</td>
              <td>${c.user}</td>
              <td>${c.idle}</td>
            </tr>
          `).join("")}
        </table>
      </div>

      <!-- Rede -->
      <div class="card">
        <h2>🌐 Rede</h2>

        <table>
          <tr>
            <th>Interface</th>
            <th>IP</th>
            <th>Família</th>
          </tr>

          ${ips.map(ip => `
            <tr>
              <td>${ip.interface}</td>
              <td>${ip.address}</td>
              <td>${ip.family}</td>
            </tr>
          `).join("")}
        </table>
      </div>

      <!-- Arquivos -->
      <div class="card">
        <h2>📂 Arquivos do Projeto</h2>
        <ul>
          ${files.map(file => `<li>${file}</li>`).join("")}
        </ul>
      </div>

      <!-- Tempo -->
      <div class="card">
        <h2>⏰ Tempo</h2>
        <p><b>Uptime:</b> ${(os.uptime() / 60).toFixed(1)} minutos</p>
        <p><b>Timezone:</b> ${Intl.DateTimeFormat().resolvedOptions().timeZone}</p>
        <p><b>ISO:</b> ${new Date().toISOString()}</p>
      </div>

      <!-- Cloud -->
      <div class="card">
        <h2>☁️ Ambiente</h2>
        <p><b>Status:</b> ${process.env.RENDER ? "Executando no Render" : "Executando Localmente"}</p>
        <p><b>PORT:</b> ${process.env.PORT || "3000"}</p>
        <p><b>NODE_ENV:</b> ${process.env.NODE_ENV || "development"}</p>
        <small>Cloud Computing + Sistemas Operacionais</small>
      </div>

    </div>

  </body>
  </html>
  `);
});

/* =========================
   Inicialização
========================= */
app.listen(PORT, () => {
  console.log("Servidor rodando na porta " + PORT);
});