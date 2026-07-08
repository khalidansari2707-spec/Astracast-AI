// Detect if we should run in Mock/Demo mode
export function isMockMode(): boolean {
  if (typeof window === "undefined") return false;

  // 1. Force mock mode via local storage setting if desired
  const forceMock = localStorage.getItem("astracast_mock_mode");
  if (forceMock === "true") return true;
  if (forceMock === "false") return false;

  // 2. If the frontend is deployed (not running on localhost) and the API URL points to localhost,
  // we must run in Mock Mode because the browser will block requests due to Mixed Content (HTTPS -> HTTP).
  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname.startsWith("192.168.");
  
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
  const apiIsLocal = apiBase.includes("localhost") || apiBase.includes("127.0.0.1");

  if (!isLocalhost && apiIsLocal) {
    return true;
  }

  return false;
}

// Initial Data Seeders
const DEFAULT_USERS = [
  { id: 1, username: "admin", role: "admin" },
  { id: 2, username: "operator", role: "operator" },
  { id: 3, username: "researcher", role: "researcher" },
];

const DEFAULT_THRESHOLDS = {
  solar_activity_index: { low: 1.0, medium: 2.5, high: 4.0, critical: 5.5 },
  solar_wind_speed: { low: 400.0, medium: 550.0, high: 700.0, critical: 850.0 },
  electron_flux: { low: 500.0, medium: 1500.0, high: 5000.0, critical: 10000.0 },
  imf_bz: { low: -2.0, medium: -5.0, high: -10.0, critical: -15.0 },
  plasma_density: { low: 10.0, medium: 25.0, high: 50.0, critical: 75.0 },
};

const INITIAL_ALERTS = [
  {
    id: 1,
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
    severity: "medium",
    message: "Solar Wind Speed exceeded 550.0 km/s. Monitoring magnetosphere compression waves.",
    parameter: "solar_wind_speed",
    value: 580.4,
    acknowledged: false,
  },
  {
    id: 2,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
    severity: "low",
    message: "Minor ionospheric load shift detected. Solar Index increased to 1.45.",
    parameter: "solar_activity_index",
    value: 1.45,
    acknowledged: false,
  },
  {
    id: 3,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    severity: "critical",
    message: "GOES Electron flux alert: Electron Flux band exceeded 5000.0 PFU. Satellite charging risk.",
    parameter: "electron_flux",
    value: 5203.1,
    acknowledged: true,
  },
];

const INITIAL_LOGS = [
  { timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), level: "info", message: "User admin logged in successfully.", user: "admin" },
  { timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), level: "warning", message: "Solar wind speed threshold alert generated.", user: "system" },
  { timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), level: "info", message: "Admin created new user: researcher_east", user: "admin" },
  { timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), level: "info", message: "Auto-ingested 5236 historical space weather records.", user: "system" },
];

const INITIAL_HISTORY = [
  {
    id: 1,
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    operator: "admin",
    prediction_horizon: "24h",
    storm_probability: 0.08,
    expected_solar_wind_speed: 420.5,
    expected_electron_flux: 150.0,
    expected_imf_bz: -1.8,
    expected_radiation_category: "S0",
    confidence: 94.2,
    explanation: "Magnetosphere stable. Mild plasma laminarity.",
    recommended_action: "Standard operation monitoring."
  },
  {
    id: 2,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    operator: "operator",
    prediction_horizon: "6h",
    storm_probability: 0.38,
    expected_solar_wind_speed: 610.2,
    expected_electron_flux: 1200.0,
    expected_imf_bz: -4.8,
    expected_radiation_category: "S1",
    confidence: 88.5,
    explanation: "Minor solar filament compression shockwave heading towards Earth.",
    recommended_action: "Prepare ground magnetometers."
  },
];

// Helper to interact with LocalStorage
function getStoredItem<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  const stored = localStorage.getItem(key);
  if (!stored) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  try {
    return JSON.parse(stored) as T;
  } catch {
    return defaultValue;
  }
}

function setStoredItem<T>(key: string, value: T): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(key, JSON.stringify(value));
  }
}

// Mock State Accessors
const getUsers = () => getStoredItem("mock_users", DEFAULT_USERS);
const setUsers = (val: typeof DEFAULT_USERS) => setStoredItem("mock_users", val);

const getThresholds = () => getStoredItem("mock_thresholds", DEFAULT_THRESHOLDS);
const setThresholds = (val: typeof DEFAULT_THRESHOLDS) => setStoredItem("mock_thresholds", val);

const getAlerts = () => getStoredItem("mock_alerts", INITIAL_ALERTS);
const setAlerts = (val: typeof INITIAL_ALERTS) => setStoredItem("mock_alerts", val);

const getLogs = () => getStoredItem("mock_logs", INITIAL_LOGS);
const setLogs = (val: typeof INITIAL_LOGS) => setStoredItem("mock_logs", val);

const getHistory = () => getStoredItem("mock_history", INITIAL_HISTORY);
const setHistory = (val: typeof INITIAL_HISTORY) => setStoredItem("mock_history", val);

const getDatasetStats = () => getStoredItem("mock_dataset_stats", {
  total_records: 5236,
  missing_values: 0,
  start_date: "2026-06-01T00:00:00Z",
  end_date: "2026-07-05T12:00:00Z",
  is_clean: true,
});
const setDatasetStats = (val: any) => setStoredItem("mock_dataset_stats", val);

// Training progress tracker
let trainingProgress = { active: false, epoch: 0, loss: 0.8, val_loss: 0.85, eta: 0 };
let trainingInterval: any = null;

// Mock Response Helper
function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

function errorResponse(detail: string, status = 400): Response {
  return jsonResponse({ detail }, status);
}

// Router Interceptor
export async function handleMockRequest(endpoint: string, init?: RequestInit): Promise<Response> {
  const method = init?.method || "GET";
  
  // Parse query parameters
  const cleanEndpoint = endpoint.split("?")[0];
  const queryStr = endpoint.split("?")[1] || "";
  const queryParams = new URLSearchParams(queryStr);

  // Authentication Header Mock
  const authHeader = init?.headers ? new Headers(init.headers).get("Authorization") : null;
  const isAuthed = authHeader && authHeader.startsWith("Bearer ");

  // 1. Auth Endpoint: Login
  if (cleanEndpoint === "/auth/login" && method === "POST") {
    const bodyStr = init?.body ? init.body.toString() : "";
    const params = new URLSearchParams(bodyStr);
    const username = params.get("username") || "admin";

    // Determine role based on username (for demo testing convenience)
    let role = "admin";
    if (username.toLowerCase().includes("operator")) {
      role = "operator";
    } else if (username.toLowerCase().includes("researcher")) {
      role = "researcher";
    }

    // Logging login audit
    const currentLogs = getLogs();
    currentLogs.unshift({
      timestamp: new Date().toISOString(),
      level: "info",
      message: `User ${username} logged in successfully (Mock Auth).`,
      user: username,
    });
    setLogs(currentLogs);

    return jsonResponse({
      access_token: `mock-jwt-token-for-${username}-${role}`,
      token_type: "bearer",
      role,
      username,
    });
  }

  // 2. Auth Endpoint: Register User
  if (cleanEndpoint === "/auth/register" && method === "POST") {
    if (!isAuthed) return errorResponse("Unauthorized", 401);
    const body = JSON.parse(init?.body?.toString() || "{}");
    const currentUsers = getUsers();

    if (currentUsers.some((u) => u.username === body.username)) {
      return errorResponse("Username already exists", 400);
    }

    const newUser = {
      id: currentUsers.length + 1,
      username: body.username,
      role: body.role || "operator",
    };
    currentUsers.push(newUser);
    setUsers(currentUsers);

    // Log registration
    const currentLogs = getLogs();
    currentLogs.unshift({
      timestamp: new Date().toISOString(),
      level: "info",
      message: `Admin created new user ${body.username} with role ${body.role}`,
      user: "admin",
    });
    setLogs(currentLogs);

    return jsonResponse({ username: newUser.username, role: newUser.role });
  }

  // 3. Auth Endpoint: Get Users
  if (cleanEndpoint === "/auth/users" && method === "GET") {
    if (!isAuthed) return errorResponse("Unauthorized", 401);
    return jsonResponse(getUsers());
  }

  // 4. Auth Endpoint: Delete User
  if (cleanEndpoint.startsWith("/auth/users/") && method === "DELETE") {
    if (!isAuthed) return errorResponse("Unauthorized", 401);
    const userId = parseInt(cleanEndpoint.split("/").pop() || "0");
    let currentUsers = getUsers();
    const targetUser = currentUsers.find((u) => u.id === userId);

    if (!targetUser) return errorResponse("User not found", 404);
    if (targetUser.username === "admin") return errorResponse("Cannot delete default admin user", 400);

    currentUsers = currentUsers.filter((u) => u.id !== userId);
    setUsers(currentUsers);

    // Log deletion
    const currentLogs = getLogs();
    currentLogs.unshift({
      timestamp: new Date().toISOString(),
      level: "info",
      message: `Admin deleted user ${targetUser.username}`,
      user: "admin",
    });
    setLogs(currentLogs);

    return jsonResponse({ message: `User ${targetUser.username} deleted successfully` });
  }

  // 5. Dashboard Summary
  if (cleanEndpoint === "/dashboard/summary" && method === "GET") {
    if (!isAuthed) return errorResponse("Unauthorized", 401);

    // Generate latest conditions
    const now = new Date();
    const solarWindSpeed = 410.0 + Math.sin(now.getTime() / 100000) * 45;
    const electronFlux = 1200 + Math.cos(now.getTime() / 80000) * 800;
    const solarActivityIndex = 1.2 + Math.sin(now.getTime() / 150000) * 0.8;
    const imfBz = -2.5 + Math.cos(now.getTime() / 120000) * 3.5;

    const currentConditions = {
      timestamp: now.toISOString(),
      electron_flux: electronFlux,
      proton_flux: 15.2,
      solar_wind_speed: solarWindSpeed,
      imf_bz: imfBz,
      plasma_density: 5.4,
      magnetic_field: 4.1,
      xray_flux: 0.08,
      solar_activity_index: solarActivityIndex,
      source: "realtime-mock",
    };

    // Predictions
    const predictions = [
      { horizon: "30m", storm_probability: 0.06, expected_electron_flux: electronFlux + 5, expected_solar_wind_speed: solarWindSpeed + 2, expected_imf_bz: imfBz, expected_radiation_category: "S0", expected_peak_time: new Date(now.getTime() + 30 * 60 * 1000).toISOString(), expected_duration: 0.5, confidence: 97.5, explanation: "Magnetosphere stable. Mild plasma laminarity.", recommended_action: "Standard operation monitoring." },
      { horizon: "6h", storm_probability: 0.12, expected_electron_flux: electronFlux + 30, expected_solar_wind_speed: solarWindSpeed + 15, expected_imf_bz: imfBz - 0.5, expected_radiation_category: "S0", expected_peak_time: new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString(), expected_duration: 1.0, confidence: 91.2, explanation: "Minor solar filament compression shockwave heading towards Earth.", recommended_action: "Prepare ground magnetometers." },
      { horizon: "12h", storm_probability: 0.18, expected_electron_flux: electronFlux + 120, expected_solar_wind_speed: solarWindSpeed + 40, expected_imf_bz: imfBz - 1.2, expected_radiation_category: "S1", expected_peak_time: new Date(now.getTime() + 12 * 60 * 60 * 1000).toISOString(), expected_duration: 3.0, confidence: 84.4, explanation: "Magnetic field boundary reconnection expected in the magnetopause.", recommended_action: "Alert low-earth orbit satellite operators." },
      { horizon: "24h", storm_probability: 0.35, expected_electron_flux: electronFlux * 1.5, expected_solar_wind_speed: solarWindSpeed + 80, expected_imf_bz: imfBz - 2.5, expected_radiation_category: "S1", expected_peak_time: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(), expected_duration: 6.0, confidence: 78.1, explanation: "Active sunspot coronal hole stream reaching Earth coordinate sector.", recommended_action: "Initiate payload checks." },
      { horizon: "3d", storm_probability: 0.55, expected_electron_flux: electronFlux * 2.2, expected_solar_wind_speed: solarWindSpeed + 180, expected_imf_bz: imfBz - 4.8, expected_radiation_category: "S2", expected_peak_time: new Date(now.getTime() + 72 * 60 * 60 * 1000).toISOString(), expected_duration: 12.0, confidence: 64.9, explanation: "Coronal Mass Ejection (CME) shockwave arrival prediction model.", recommended_action: "Deploy active radiation shielding for satellite modules. Alert power grids." },
      { horizon: "7d", storm_probability: 0.22, expected_electron_flux: electronFlux + 50, expected_solar_wind_speed: solarWindSpeed + 20, expected_imf_bz: imfBz, expected_radiation_category: "S0", expected_peak_time: new Date(now.getTime() + 168 * 60 * 60 * 1000).toISOString(), expected_duration: 2.0, confidence: 52.3, explanation: "Return to baseline solar wind conditions post coronal hole passage.", recommended_action: "Standard operation." },
    ];

    // Alerts
    const unacknowledgedAlerts = getAlerts().filter((a) => !a.acknowledged);

    // Active storm countdown (probability > 0.5)
    const countdownPred = predictions.find((p) => p.storm_probability > 0.5);
    const countdown = countdownPred ? {
      peak_time: countdownPred.expected_peak_time,
      probability: countdownPred.storm_probability,
      category: countdownPred.expected_radiation_category,
    } : null;

    // Timeline chart data (48 hours historical + 6 predictions)
    const chartData = [];
    for (let i = 48; i >= 1; i--) {
      const historicalTime = new Date(now.getTime() - i * 60 * 60 * 1000);
      chartData.push({
        timestamp: historicalTime.toISOString(),
        solar_activity_index: solarActivityIndex + Math.sin(historicalTime.getTime()) * 0.2,
        solar_wind_speed: solarWindSpeed + Math.sin(historicalTime.getTime()) * 20,
        electron_flux: electronFlux + Math.cos(historicalTime.getTime()) * 200,
        imf_bz: imfBz + Math.sin(historicalTime.getTime()) * 0.8,
        plasma_density: 5.4,
        type: "actual",
      });
    }

    const horizonsMap: Record<string, number> = { "30m": 0.5, "6h": 6, "12h": 12, "24h": 24, "3d": 72, "7d": 168 };
    predictions.forEach((p) => {
      const hoursOffset = horizonsMap[p.horizon] || 0.5;
      chartData.push({
        timestamp: new Date(now.getTime() + hoursOffset * 60 * 60 * 1000).toISOString(),
        solar_activity_index: solarActivityIndex * (1 + p.storm_probability),
        solar_wind_speed: p.expected_solar_wind_speed,
        electron_flux: p.expected_electron_flux,
        imf_bz: p.expected_imf_bz,
        plasma_density: 5.4,
        type: "predicted",
      });
    });

    return jsonResponse({
      current_conditions: currentConditions,
      predictions,
      countdown,
      recent_alerts: unacknowledgedAlerts.slice(0, 5),
      chart_data: chartData,
      stats: {
        total_alerts: getAlerts().length,
        active_alerts: unacknowledgedAlerts.length,
        avg_confidence: predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length,
        risk_score: Math.max(...predictions.map((p) => p.storm_probability)) * 100,
      },
    });
  }

  // 6. Predict: Run Prediction Form
  if (cleanEndpoint === "/predict/run" && method === "POST") {
    if (!isAuthed) return errorResponse("Unauthorized", 401);
    const body = JSON.parse(init?.body?.toString() || "{}");

    // Math calculation to return realistic AI prediction results
    const wind = parseFloat(body.solar_wind_speed || "400");
    const density = parseFloat(body.plasma_density || "5");
    const bz = parseFloat(body.imf_bz || "0");
    const xray = parseFloat(body.xray_flux || "0.01");
    const electron_flux = parseFloat(body.electron_flux || "150");
    const proton_flux = parseFloat(body.proton_flux || "10");

    // Let's generate a prediction list for the 6 horizons
    const horizons = ["30m", "6h", "12h", "24h", "3d", "7d"];
    const horizon_confidences: Record<string, number> = { "30m": 96.5, "6h": 88.2, "12h": 82.7, "24h": 76.4, "3d": 64.1, "7d": 52.8 };

    // Physics-based risk calculation
    let base_risk = 0.05;
    if (bz < 0) {
      base_risk += Math.abs(bz) * 0.05;
    }
    if (wind > 400) {
      base_risk += ((wind - 400) / 400) * 0.35;
    }
    if (electron_flux > 1000) {
      base_risk += (Math.log10(electron_flux) - 3) * 0.15;
    }
    const storm_prob = Math.min(0.99, Math.max(0.01, base_risk));

    const currentHistory = getHistory();

    const predictions = horizons.map((h, idx) => {
      const decay = Math.pow(0.95, idx + 1);
      const h_wind = wind * decay + 400.0 * (1.0 - decay);
      const h_bz = bz * decay - 0.5 * (1.0 - decay);
      const h_electron = electron_flux * decay + 500.0 * (1.0 - decay);
      let h_prob = storm_prob * decay + 0.1 * (1.0 - decay);
      h_prob = Math.min(0.99, Math.max(0.01, h_prob));

      let rad_cat = "S0";
      if (h_electron < 10.0) rad_cat = "S0";
      else if (h_electron < 100.0) rad_cat = "S1";
      else if (h_electron < 1000.0) rad_cat = "S2";
      else if (h_electron < 10000.0) rad_cat = "S3";
      else if (h_electron < 50000.0) rad_cat = "S4";
      else rad_cat = "S5";

      const predObj = {
        id: currentHistory.length + idx + 1,
        timestamp: new Date().toISOString(),
        operator: localStorage.getItem("astracast_user") || "operator",
        prediction_horizon: h,
        storm_probability: h_prob,
        expected_solar_wind_speed: h_wind,
        expected_electron_flux: h_electron,
        expected_imf_bz: h_bz,
        expected_radiation_category: rad_cat,
        confidence: horizon_confidences[h] || 75.0,
        explanation: `Forecast event probability is ${(h_prob * 100).toFixed(0)}%. Wind speed: ${h_wind.toFixed(0)} km/s.`,
        recommended_action: h_prob > 0.5 ? "Increase payload shielding." : "Standard monitoring."
      };

      // Add to history list
      currentHistory.unshift(predObj);

      return predObj;
    });

    setHistory(currentHistory);

    // Generate Alert if high risk at short term
    const shortTermProb = predictions.find(p => p.prediction_horizon === "30m" || p.prediction_horizon === "6h")?.storm_probability || 0;
    if (shortTermProb > 0.6) {
      const currentAlerts = getAlerts();
      currentAlerts.unshift({
        id: currentAlerts.length + 1,
        timestamp: new Date().toISOString(),
        severity: shortTermProb > 0.85 ? "critical" : "high",
        message: `Upcoming Radiation Storm forecast. Expected S2+ with ${(shortTermProb*100).toFixed(0)}% probability.`,
        parameter: "electron_flux",
        value: electron_flux,
        acknowledged: false,
      });
      setAlerts(currentAlerts);
    }

    return jsonResponse({
      message: "Forecast run completed.",
      predictions
    });
  }

  // 7. Predict: Scenario Simulator
  if (cleanEndpoint === "/predict/simulate" && method === "POST") {
    if (!isAuthed) return errorResponse("Unauthorized", 401);
    const body = JSON.parse(init?.body?.toString() || "{}");

    const wind = parseFloat(body.solar_wind_speed || "400");
    const density = parseFloat(body.plasma_density || "5");
    const bz = parseFloat(body.imf_bz || "0");
    const xray = parseFloat(body.xray_flux || "0.01");
    const electron_flux = parseFloat(body.electron_flux || "150");
    const proton_flux = parseFloat(body.proton_flux || "10");

    // Math calculation for real-time slider updates
    let prob = 0.02;
    if (wind > 500) prob += 0.15;
    if (wind > 700) prob += 0.25;
    if (density > 15) prob += 0.1;
    if (density > 40) prob += 0.2;
    if (bz < -3) prob += 0.2;
    if (bz < -8) prob += 0.25;
    if (xray > 0.1) prob += 0.15;
    if (xray > 0.5) prob += 0.3;
    prob = Math.min(0.99, prob);

    const horizons = ["30m", "6h", "12h", "24h", "3d", "7d"];
    const horizon_confidences: Record<string, number> = { "30m": 96.5, "6h": 88.2, "12h": 82.7, "24h": 76.4, "3d": 64.1, "7d": 52.8 };

    const predictions = horizons.map((h, idx) => {
      const decay = Math.pow(0.95, idx + 1);
      const h_wind = wind * decay + 400.0 * (1.0 - decay);
      const h_bz = bz * decay - 0.5 * (1.0 - decay);
      const h_electron = electron_flux * decay + 500.0 * (1.0 - decay);
      let h_prob = prob * decay + 0.1 * (1.0 - decay);
      h_prob = Math.min(0.99, Math.max(0.01, h_prob));

      let rad_cat = "S0";
      if (h_electron < 10.0) rad_cat = "S0";
      else if (h_electron < 100.0) rad_cat = "S1";
      else if (h_electron < 1000.0) rad_cat = "S2";
      else if (h_electron < 10000.0) rad_cat = "S3";
      else if (h_electron < 50000.0) rad_cat = "S4";
      else rad_cat = "S5";

      return {
        horizon: h,
        storm_probability: h_prob,
        expected_electron_flux: h_electron,
        expected_solar_wind_speed: h_wind,
        expected_imf_bz: h_bz,
        expected_radiation_category: rad_cat,
        expected_peak_time: new Date(Date.now() + (idx + 1) * 3600 * 1000).toISOString(),
        expected_duration: h_prob > 0.5 ? 12.0 : 4.0,
        confidence: horizon_confidences[h] || 75.0,
        explanation: `Simulated prediction horizon for ${h}.`,
        recommended_action: h_prob > 0.5 ? "Take precautionary measures." : "Normal operations."
      };
    });

    return jsonResponse({
      predictions
    });
  }

  // 8. Predict: History List
  if (cleanEndpoint === "/predict/history" && method === "GET") {
    if (!isAuthed) return errorResponse("Unauthorized", 401);
    return jsonResponse(getHistory());
  }

  // 9. Analytics Metrics
  if (cleanEndpoint === "/analytics/metrics" && method === "GET") {
    if (!isAuthed) return errorResponse("Unauthorized", 401);

    const now = new Date();
    
    // Timeline trend (resampled dates)
    const timeline = [];
    for (let i = 24; i >= 1; i--) {
      timeline.push({
        timestamp: new Date(now.getTime() - i * 60 * 60 * 1000).toISOString(),
        electron_flux: 1500 + Math.sin(i) * 500,
        proton_flux: 12.5 + Math.cos(i) * 3,
        solar_wind_speed: 430 + Math.sin(i / 2) * 50,
        imf_bz: -2.0 + Math.sin(i / 3) * 3,
        plasma_density: 6.0,
        solar_activity_index: 1.1 + Math.sin(i / 4) * 0.4,
      });
    }

    // Heatmap hour-of-day vs day-of-week intensity
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const heatmap = [];
    for (const d of days) {
      for (let h = 0; h < 24; h += 3) {
        heatmap.push({
          day: d,
          hour: h,
          intensity: 0.5 + Math.sin((days.indexOf(d) * h) / 10) * 0.8,
        });
      }
    }

    // Radar chart comparative parameters
    const radar = [
      { parameter: "Electron Flux", "High Activity": 88, "Low Activity": 22 },
      { parameter: "Proton Flux", "High Activity": 75, "Low Activity": 18 },
      { parameter: "Solar Wind Speed", "High Activity": 92, "Low Activity": 41 },
      { parameter: "Plasma Density", "High Activity": 64, "Low Activity": 30 },
      { parameter: "Magnetic Field", "High Activity": 80, "Low Activity": 35 },
    ];

    // Bin distribution
    const distribution = [
      { bin: "0-1000", count: 180 },
      { bin: "1000-2000", count: 320 },
      { bin: "2000-3000", count: 150 },
      { bin: "3000-4000", count: 65 },
      { bin: "4000-5000", count: 32 },
      { bin: "5000-6000", count: 12 },
      { bin: "6000-7000", count: 4 },
      { bin: "7000-8000", count: 2 },
    ];

    // Model accuracy trend over last 7 days
    const accuracyTrend = [];
    for (let i = 6; i >= 0; i--) {
      const dayTime = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      accuracyTrend.push({
        day: dayTime.toLocaleDateString([], { month: "short", day: "numeric" }),
        accuracy: 92.4 + Math.sin(i) * 1.5,
      });
    }

    return jsonResponse({
      timeline,
      heatmap,
      radar,
      distribution,
      accuracy_trend: accuracyTrend,
      performance: {
        rmse: 14.5,
        mae: 9.2,
        mape: 0.082,
        r2: 0.941,
      },
    });
  }

  // 10. Data Endpoint: Statistics
  if (cleanEndpoint === "/data/statistics" && method === "GET") {
    if (!isAuthed) return errorResponse("Unauthorized", 401);
    return jsonResponse(getDatasetStats());
  }

  // 11. Data Endpoint: Upload
  if (cleanEndpoint === "/data/upload" && method === "POST") {
    if (!isAuthed) return errorResponse("Unauthorized", 401);
    
    // Simulate uploading CSV
    const stats = {
      total_records: 6245,
      missing_values: 12,
      start_date: "2026-06-01T00:00:00Z",
      end_date: "2026-07-05T18:00:00Z",
      is_clean: false,
    };
    setDatasetStats(stats);

    // Audit logs
    const currentLogs = getLogs();
    currentLogs.unshift({
      timestamp: new Date().toISOString(),
      level: "info",
      message: `User ${localStorage.getItem("astracast_user")} uploaded new CSV dataset. 1009 new records loaded.`,
      user: localStorage.getItem("astracast_user") || "operator",
    });
    setLogs(currentLogs);

    return jsonResponse({
      message: "Dataset uploaded successfully.",
      stats,
    });
  }

  // 12. Data Endpoint: Clean
  if (cleanEndpoint === "/data/clean" && method === "POST") {
    if (!isAuthed) return errorResponse("Unauthorized", 401);
    
    // Simulate cleaning
    const stats = getDatasetStats();
    stats.missing_values = 0;
    stats.is_clean = true;
    setDatasetStats(stats);

    const currentLogs = getLogs();
    currentLogs.unshift({
      timestamp: new Date().toISOString(),
      level: "info",
      message: "Triggered dataset linear interpolation and outlier removal.",
      user: localStorage.getItem("astracast_user") || "operator",
    });
    setLogs(currentLogs);

    return jsonResponse({
      message: "Data cleaning complete. Linear interpolation applied to 12 missing fields.",
      stats,
    });
  }

  // 13. Data Endpoint: Clear
  if (cleanEndpoint === "/data/clear" && method === "DELETE") {
    if (!isAuthed) return errorResponse("Unauthorized", 401);

    const stats = {
      total_records: 0,
      missing_values: 0,
      start_date: null,
      end_date: null,
      is_clean: true,
    };
    setDatasetStats(stats);

    const currentLogs = getLogs();
    currentLogs.unshift({
      timestamp: new Date().toISOString(),
      level: "warning",
      message: "All space weather database entries cleared by admin.",
      user: localStorage.getItem("astracast_user") || "admin",
    });
    setLogs(currentLogs);

    return jsonResponse({ message: "Dataset database cleared." });
  }

  // 14. Data Endpoint: Train Model
  if (cleanEndpoint === "/data/train" && method === "POST") {
    if (!isAuthed) return errorResponse("Unauthorized", 401);

    if (trainingProgress.active) {
      return errorResponse("Model training is already in progress.", 400);
    }

    // Start background training simulation
    trainingProgress = {
      active: true,
      epoch: 0,
      loss: 0.85,
      val_loss: 0.90,
      eta: 15,
    };

    if (trainingInterval) clearInterval(trainingInterval);

    trainingInterval = setInterval(() => {
      if (trainingProgress.epoch >= 10) {
        trainingProgress.active = false;
        clearInterval(trainingInterval);
        
        // Log training completed
        const logsList = getLogs();
        logsList.unshift({
          timestamp: new Date().toISOString(),
          level: "info",
          message: "Neural Network model retrained. Updated parameters saved. New validation R²: 0.945.",
          user: "system",
        });
        setLogs(logsList);
      } else {
        trainingProgress.epoch += 1;
        trainingProgress.loss = Math.max(0.05, trainingProgress.loss - Math.random() * 0.1);
        trainingProgress.val_loss = trainingProgress.loss * (1.02 + Math.random() * 0.05);
        trainingProgress.eta = 15 - trainingProgress.epoch;
      }
    }, 1500);

    return jsonResponse({ message: "Background training process initialized." });
  }

  // 15. Data Endpoint: Training Status
  if (cleanEndpoint === "/data/train/status" && method === "GET") {
    if (!isAuthed) return errorResponse("Unauthorized", 401);
    return jsonResponse({
      status: trainingProgress.active ? "training" : "completed",
      progress: trainingProgress.active ? (trainingProgress.epoch * 10) : 100,
      loss_curves: [],
      metrics: {
        "30m": { "rmse": 12.4, "mae": 8.1, "mape": 0.075, "r2": 0.952 },
        "6h": { "rmse": 14.5, "mae": 9.2, "mape": 0.082, "r2": 0.941 }
      },
      feature_importance: []
    });
  }

  // 16. Alerts List
  if (cleanEndpoint === "/alerts" && method === "GET") {
    if (!isAuthed) return errorResponse("Unauthorized", 401);
    const unreadOnly = queryParams.get("unacknowledged_only") === "true";
    let list = getAlerts();
    if (unreadOnly) {
      list = list.filter((a) => !a.acknowledged);
    }
    return jsonResponse(list);
  }

  // 17. Alert: Acknowledge
  if (cleanEndpoint.startsWith("/alerts/") && cleanEndpoint.endsWith("/acknowledge") && method === "POST") {
    if (!isAuthed) return errorResponse("Unauthorized", 401);
    const parts = cleanEndpoint.split("/");
    const alertId = parseInt(parts[parts.length - 2] || "0");
    const currentAlerts = getAlerts();
    const alert = currentAlerts.find((a) => a.id === alertId);

    if (!alert) return errorResponse("Alert not found", 404);
    alert.acknowledged = true;
    setAlerts(currentAlerts);

    return jsonResponse({ message: `Alert ${alertId} acknowledged.` });
  }

  // 18. Alert: Acknowledge All
  if (cleanEndpoint === "/alerts/acknowledge-all" && method === "POST") {
    if (!isAuthed) return errorResponse("Unauthorized", 401);
    const currentAlerts = getAlerts();
    currentAlerts.forEach((a) => {
      a.acknowledged = true;
    });
    setAlerts(currentAlerts);

    return jsonResponse({ message: "All alerts acknowledged." });
  }

  // 19. Settings: Thresholds (GET & POST)
  if (cleanEndpoint === "/settings/thresholds") {
    if (!isAuthed) return errorResponse("Unauthorized", 401);
    if (method === "GET") {
      return jsonResponse(getThresholds());
    }
    if (method === "POST") {
      const body = JSON.parse(init?.body?.toString() || "{}");
      setThresholds(body);

      // Log configuration change
      const currentLogs = getLogs();
      currentLogs.unshift({
        timestamp: new Date().toISOString(),
        level: "warning",
        message: "System sensor thresholds updated by administrator.",
        user: localStorage.getItem("astracast_user") || "admin",
      });
      setLogs(currentLogs);

      return jsonResponse({ message: "Threshold settings updated successfully.", thresholds: body });
    }
  }

  // 20. Settings: Audit Logs
  if (cleanEndpoint === "/settings/logs" && method === "GET") {
    if (!isAuthed) return errorResponse("Unauthorized", 401);
    return jsonResponse(getLogs());
  }

  // 21. Reports Download (PDF, Excel, CSV)
  if (cleanEndpoint.startsWith("/reports/download/") && method === "GET") {
    if (!isAuthed) return errorResponse("Unauthorized", 401);
    const format = cleanEndpoint.split("/").pop() || "csv";
    
    // Create a mock blob stream
    const dummyContent = `AstraCast Space Weather Report (${format.toUpperCase()})\nReport Generated: ${new Date().toISOString()}\n`;
    return new Response(dummyContent, {
      status: 200,
      headers: {
        "Content-Type": format === "pdf" ? "application/pdf" : format === "xlsx" ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" : "text/csv",
        "Content-Disposition": `attachment; filename=astracast_report.${format}`,
      },
    });
  }

  return errorResponse("Mock Endpoint Not Found", 404);
}
