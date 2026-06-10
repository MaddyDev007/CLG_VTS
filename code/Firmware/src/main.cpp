#include <HardwareSerial.h>
#include <Preferences.h>
#include <ctype.h>
#include <stdint.h>
#include <stdio.h>
#include "config.h"

// ----------------------
// Config
// ----------------------
HardwareSerial sim(2); // EC25 UART

const char* apn = "airtelgprs.com";
const char* mqtt_broker = MQTT_BROKER;
const int mqtt_port = MQTT_PORT;
const char* mqtt_username = MQTT_USERNAME;
const char* mqtt_password = MQTT_PASSWORD;
const char* mqtt_client_prefix = "ESP32_LTE_GPS_Client_";
const char* firmware_version = "0.2.0";

const char* configured_device_imei = DEVICE_IMEI;
const char* notify_number = "+918248034240"; // replace with your number

const int sim_rx_pin = EC25_RX;
const int sim_tx_pin = EC25_TX;
const int ignition_input_pin = IGNITION_PIN;
const bool ignition_fallback_state = true; // TODO: replace with real ignition input before production deployment.

const uint64_t fallback_epoch_base_ms = 1700000000000ULL;
const int default_battery_mv = 3900;
const int default_signal_dbm = -70;
const int mqtt_reconnect_attempts = 3;
const unsigned long mqtt_reconnect_backoff_ms[mqtt_reconnect_attempts] = {1000, 2000, 5000};
const int telemetry_queue_capacity = 20;
const unsigned long mqtt_open_timeout_ms = 7000;
const unsigned long mqtt_connect_timeout_ms = 5000;
const unsigned long mqtt_publish_prompt_timeout_ms = 3000;
const unsigned long mqtt_publish_ack_timeout_ms = 5000;
const unsigned long modem_idle_window_ms = 200;
const unsigned long gps_location_timeout_ms = 3000;
const int gps_restart_after_failures = 5;
const unsigned long modem_ready_timeout_ms = 30000;
const unsigned long sim_ready_timeout_ms = 30000;
const unsigned long network_registration_timeout_ms = 90000;
const unsigned long gprs_attach_timeout_ms = 60000;
const unsigned long connectivity_maintenance_interval_ms = 15000;
const unsigned long mqtt_reconnect_interval_ms = 30000;
const unsigned long startup_sms_retry_interval_ms = 60000;

// ----------------------
// Types
// ----------------------
struct TelemetrySample {
  uint64_t timestampMs;
  bool hasIsoTimestamp;
  String timestampIso;
  float lat;
  float lng;
  float speedKmh;
  bool ignition;
  int batteryMv;
  int signalDbm;
};

struct QueuedMessage {
  String topic;
  String payload;
};

// ----------------------
// State
// ----------------------
Preferences preferences;
int lastKnownSignalDbm = default_signal_dbm;
int lastKnownBatteryMv = default_battery_mv;
bool mqttConnected = false;
bool lteReady = false;
bool startupSmsSent = false;
QueuedMessage telemetryQueue[telemetry_queue_capacity];
int queueHead = 0;
int queueCount = 0;
unsigned long lastTelemetryPollAtMs = 0;
unsigned long lastConnectivityMaintenanceAtMs = 0;
unsigned long nextMqttReconnectAtMs = 0;
unsigned long nextStartupSmsAtMs = 0;
int consecutiveGpsFailures = 0;
String cachedDeviceImei = "";
unsigned long ignitionOnPollIntervalMs = 5000;
unsigned long ignitionOffPollIntervalMs = 10000;
const unsigned long minTelemetryIntervalMs = 1000;
const unsigned long maxTelemetryIntervalMs = 60000;
const char* nvs_namespace = "vts_cfg";
const char* nvs_ignition_on_interval_key = "onInterval";
const char* nvs_ignition_off_interval_key = "offInterval";

// ----------------------
// Function prototypes
// ----------------------
void clearModemInput();
String readModemUntilQuiet(unsigned long timeoutMs, unsigned long idleWindowMs = modem_idle_window_ms);
String readModemUntilPattern(const String& pattern, unsigned long timeoutMs);
String readATResponse(const String& cmd, unsigned long waitTime = 2000);
String readATResponseUntil(const String& cmd, const String& pattern, unsigned long waitTime);
void sendAT(const String& cmd, unsigned long waitTime = 2000);
bool setupLTE();
bool connectMQTT();
void closeMqttSession();
void maintainConnectivity();
bool ensureMqttConnected();
bool publishMessage(const String& topic, const String& msg);
bool publishRawMessage(const String& topic, const String& msg);
void processIncomingMqttMessages(const String& modemOutput);
void handleCommand(const String& payload);
bool flushQueuedMessages();
void enqueueMessage(const String& topic, const String& payload);
bool queueIsEmpty();
QueuedMessage peekQueuedMessage();
void popQueuedMessage();
int queuedMessageCount();
void logModemResponse(const char* label, const String& response);
bool responseContainsFailure(const String& response);
bool responseContainsSuccess(const String& response, const String& successPattern);
bool responseContainsNetworkRegistration(const String& response);
bool responseContainsGprsAttached(const String& response);
bool responseContainsPdpActivation(const String& response);
bool responseContainsActivePdpContext(const String& response);
bool responseContainsMqttOpenSuccess(const String& response);
bool responseContainsMqttClientOccupied(const String& response);
bool waitForModemReady(unsigned long timeoutMs);
bool waitForSimReady(unsigned long timeoutMs);
bool waitForNetworkRegistration(unsigned long timeoutMs);
bool waitForGprsAttach(unsigned long timeoutMs);
bool validateApnConfig();
bool hasMqttCredentials();
bool validateMqttBrokerConfig();
void logBootConfiguration();
void loadIntervalsFromNvs();
bool saveIntervalsToNvs(unsigned long ignitionOnIntervalMs, unsigned long ignitionOffIntervalMs);
bool isValidTelemetryInterval(unsigned long intervalMs);
bool startGps();
void handleGpsPollFailure(const String& gpsResponse);
bool sendStartupSMS();
bool parseGPS(const String& raw, TelemetrySample& sample);
float parseLatLon(String s);
String buildTelemetryTopic();
String buildIdentityTopic();
String buildCommandTopic();
String buildAckTopic();
String buildMqttClientId();
String getDeviceImei();
String buildTelemetryJson(const TelemetrySample& sample);
String buildIdentityJson();
String buildAckJson(unsigned long ignitionOnIntervalMs, unsigned long ignitionOffIntervalMs);
String readImei();
String readImsi();
String uint64ToString(uint64_t value);
bool tryBuildIsoTimestamp(const String& utc, const String& date, String& isoTimestamp);
bool readIgnitionState();
int readSignalDbm();
int readBatteryMillivolts();
uint64_t resolveTimestampMs(const String& utc, const String& date);
uint64_t epochMsFromDateTime(int year, int month, int day, int hour, int minute, int second, int millisecond);
uint64_t fallbackTimestampMs();
bool isLeapYear(int year);
int daysInMonth(int year, int month);
bool extractQuotedField(const String& input, int& cursor, String& value);
bool extractQmtRecvPayload(const String& input, int& cursor, String& value);
bool extractJsonStringValue(const String& json, const String& key, String& value);
bool extractJsonUnsignedLongValue(const String& json, const String& key, unsigned long& value);

// ----------------------
// Setup
// ----------------------
void setup() {
  Serial.begin(115200);
  sim.begin(UART_BAUD, SERIAL_8N1, sim_rx_pin, sim_tx_pin);
  delay(3000);

  loadIntervalsFromNvs();
  logBootConfiguration();

  if (ignition_input_pin >= 0) {
    pinMode(ignition_input_pin, INPUT);
  } else {
    Serial.println("WARNING: IGNITION_PIN is disabled; using ignition fallback state");
  }

  Serial.println("Initializing LTE + GPS...");

  if (!startGps()) {
    Serial.println("GNSS start command did not confirm; telemetry will keep retrying");
  }

  lteReady = setupLTE();
  if (!lteReady) {
    Serial.println("LTE setup incomplete; firmware will retry while continuing GPS telemetry collection");
  }

  maintainConnectivity();
}

// ----------------------
// Main loop
// ----------------------
void loop() {
  String modemOutput = readModemUntilQuiet(50, 20);
  if (modemOutput.length() > 0) {
    processIncomingMqttMessages(modemOutput);
  }

  maintainConnectivity();

  if (mqttConnected && !queueIsEmpty()) {
    flushQueuedMessages();
  }

  unsigned long now = millis();
  bool currentIgnition = readIgnitionState();
  unsigned long activePollIntervalMs = currentIgnition ? ignitionOnPollIntervalMs : ignitionOffPollIntervalMs;
  if (now - lastTelemetryPollAtMs < activePollIntervalMs) {
    return;
  }

  lastTelemetryPollAtMs = now;
  sim.println("AT+QGPSLOC?");
  String gpsResponse = readModemUntilQuiet(gps_location_timeout_ms, 150);
  if (gpsResponse.length() > 0) {
    processIncomingMqttMessages(gpsResponse);
  }

  String line = "";
  bool foundGpsSample = false;
  for (int i = 0; i < gpsResponse.length(); i++) {
    char c = gpsResponse.charAt(i);
    if (c == '\r') {
      continue;
    }

    if (c == '\n') {
      line.trim();
      if (line.startsWith("+QGPSLOC:")) {
        foundGpsSample = true;
        TelemetrySample sample;
        if (!parseGPS(line, sample)) {
          Serial.println("Failed to parse GPS sample");
          line = "";
          continue;
        }

        sample.ignition = currentIgnition;
        sample.batteryMv = readBatteryMillivolts();
        sample.signalDbm = readSignalDbm();

        String topic = buildTelemetryTopic();
        String json = buildTelemetryJson(sample);

        Serial.println("Telemetry topic: " + topic);
        Serial.println("Telemetry payload: " + json);

        if (!publishMessage(topic, json)) {
          Serial.println("Telemetry publish failed; payload queued for retry");
        }
        consecutiveGpsFailures = 0;
      }
      line = "";
      continue;
    }

    line += c;
  }

  line.trim();
  if (line.startsWith("+QGPSLOC:")) {
    foundGpsSample = true;
    TelemetrySample sample;
    if (!parseGPS(line, sample)) {
      Serial.println("Failed to parse GPS sample");
      return;
    }

    sample.ignition = currentIgnition;
    sample.batteryMv = readBatteryMillivolts();
    sample.signalDbm = readSignalDbm();

    String topic = buildTelemetryTopic();
    String json = buildTelemetryJson(sample);

    Serial.println("Telemetry topic: " + topic);
    Serial.println("Telemetry payload: " + json);

    if (!publishMessage(topic, json)) {
      Serial.println("Telemetry publish failed; payload queued for retry");
    }
    consecutiveGpsFailures = 0;
  }

  if (!foundGpsSample) {
    handleGpsPollFailure(gpsResponse);
  }
}

// ----------------------
// LTE / MQTT functions
// ----------------------
void clearModemInput() {
  while (sim.available()) {
    sim.read();
  }
}

String readModemUntilQuiet(unsigned long timeoutMs, unsigned long idleWindowMs) {
  unsigned long start = millis();
  unsigned long lastDataAt = millis();
  String response = "";

  while (millis() - start < timeoutMs) {
    bool receivedAny = false;
    while (sim.available()) {
      response += static_cast<char>(sim.read());
      lastDataAt = millis();
      receivedAny = true;
    }

    if (response.length() > 0 && !receivedAny && (millis() - lastDataAt) >= idleWindowMs) {
      break;
    }

    delay(10);
  }

  return response;
}

String readModemUntilPattern(const String& pattern, unsigned long timeoutMs) {
  unsigned long start = millis();
  String response = "";

  while (millis() - start < timeoutMs) {
    while (sim.available()) {
      response += static_cast<char>(sim.read());
    }

    if (pattern.length() > 0 && response.indexOf(pattern) >= 0) {
      break;
    }

    if (responseContainsFailure(response)) {
      break;
    }

    delay(10);
  }

  unsigned long quietStart = millis();
  while (millis() - quietStart < modem_idle_window_ms) {
    while (sim.available()) {
      response += static_cast<char>(sim.read());
      quietStart = millis();
    }
    delay(10);
  }

  return response;
}

String readATResponse(const String& cmd, unsigned long waitTime) {
  clearModemInput();
  sim.println(cmd);
  return readModemUntilQuiet(waitTime);
}

String readATResponseUntil(const String& cmd, const String& pattern, unsigned long waitTime) {
  clearModemInput();
  sim.println(cmd);
  return readModemUntilPattern(pattern, waitTime);
}

void sendAT(const String& cmd, unsigned long waitTime) {
  String response = readATResponse(cmd, waitTime);
  if (response.length() > 0) {
    Serial.print(response);
  }
}

void logModemResponse(const char* label, const String& response) {
  Serial.println(String(label) + ":");
  if (response.length() == 0) {
    Serial.println("  No response from modem");
    return;
  }
  Serial.println(response);
}

bool responseContainsFailure(const String& response) {
  return response.indexOf("ERROR") >= 0 ||
         response.indexOf("+CME ERROR") >= 0 ||
         response.indexOf("+CMS ERROR") >= 0 ||
         response.indexOf("FAIL") >= 0;
}

bool responseContainsSuccess(const String& response, const String& successPattern) {
  return response.indexOf(successPattern) >= 0 && !responseContainsFailure(response);
}

bool responseContainsNetworkRegistration(const String& response) {
  return !responseContainsFailure(response) &&
         (response.indexOf(",1") >= 0 || response.indexOf(",5") >= 0);
}

bool responseContainsGprsAttached(const String& response) {
  return !responseContainsFailure(response) &&
         (response.indexOf(": 1") >= 0 || response.indexOf(":1") >= 0);
}

bool responseContainsPdpActivation(const String& response) {
  return !responseContainsFailure(response) &&
         (response.indexOf("+QIACT:") >= 0 || response.indexOf("OK") >= 0);
}

bool responseContainsActivePdpContext(const String& response) {
  return !responseContainsFailure(response) && response.indexOf("+QIACT:") >= 0;
}

bool responseContainsMqttOpenSuccess(const String& response) {
  return responseContainsSuccess(response, "+QMTOPEN: 0,0");
}

bool responseContainsMqttClientOccupied(const String& response) {
  return !responseContainsFailure(response) && response.indexOf("+QMTOPEN: 0,2") >= 0;
}

bool waitForModemReady(unsigned long timeoutMs) {
  unsigned long start = millis();
  int attempt = 1;

  while (millis() - start < timeoutMs) {
    String response = readATResponse("AT", 1000);
    if (responseContainsSuccess(response, "OK")) {
      return true;
    }

    Serial.println("Waiting for modem AT response, attempt " + String(attempt));
    attempt++;
    delay(1000);
  }

  return false;
}

bool waitForSimReady(unsigned long timeoutMs) {
  unsigned long start = millis();

  while (millis() - start < timeoutMs) {
    String response = readATResponse("AT+CPIN?", 2000);
    logModemResponse("AT+CPIN? response", response);
    if (response.indexOf("+CPIN: READY") >= 0 && !responseContainsFailure(response)) {
      return true;
    }

    delay(2000);
  }

  return false;
}

bool waitForNetworkRegistration(unsigned long timeoutMs) {
  unsigned long start = millis();

  while (millis() - start < timeoutMs) {
    String response = readATResponse("AT+CREG?", 2000);
    logModemResponse("AT+CREG? response", response);
    if (responseContainsNetworkRegistration(response)) {
      return true;
    }

    Serial.println("Waiting for cellular tower registration...");
    delay(3000);
  }

  return false;
}

bool waitForGprsAttach(unsigned long timeoutMs) {
  unsigned long start = millis();

  while (millis() - start < timeoutMs) {
    String response = readATResponse("AT+CGATT?", 2000);
    logModemResponse("AT+CGATT? response", response);
    if (responseContainsGprsAttached(response)) {
      return true;
    }

    Serial.println("Waiting for packet data attach...");
    delay(3000);
  }

  return false;
}

bool validateApnConfig() {
  String configuredApn = String(apn);
  configuredApn.trim();
  if (configuredApn.length() == 0) {
    Serial.println("ERROR: APN is empty. LTE PDP activation cannot continue.");
    return false;
  }

  return true;
}

bool hasMqttCredentials() {
  return String(mqtt_username).length() > 0 || String(mqtt_password).length() > 0;
}

bool validateMqttBrokerConfig() {
  String broker = String(mqtt_broker);
  broker.trim();

  if (broker.length() == 0) {
    Serial.println("ERROR: MQTT_BROKER is empty. Firmware and backend will not sync.");
    return false;
  }

  if (broker == "YOUR_BACKEND_BROKER_IP_OR_DOMAIN") {
    Serial.println("ERROR: MQTT_BROKER is still the placeholder value.");
    Serial.println("ERROR: Set it to the exact broker host or IP used by the backend.");
    return false;
  }

  if (broker == "localhost" || broker == "127.0.0.1" || broker == "0.0.0.0") {
    Serial.println("ERROR: MQTT_BROKER points to a loopback/local-only address.");
    Serial.println("ERROR: Firmware needs a reachable LAN/public broker host, not localhost.");
    return false;
  }

  return true;
}

void logBootConfiguration() {
  Serial.println("Firmware boot configuration:");
  Serial.println("  IMEI: " + getDeviceImei());
  Serial.println("  MQTT Broker: " + String(mqtt_broker));
  Serial.println("  MQTT Port: " + String(mqtt_port));
  Serial.println("  MQTT Client: " + buildMqttClientId());
  Serial.println("  Telemetry Topic: " + buildTelemetryTopic());
  Serial.println("  Identity Topic: " + buildIdentityTopic());
  Serial.println("  Ignition ON Interval: " + String(ignitionOnPollIntervalMs) + " ms");
  Serial.println("  Ignition OFF Interval: " + String(ignitionOffPollIntervalMs) + " ms");
  Serial.println("  EC25 RX/TX: " + String(sim_rx_pin) + "/" + String(sim_tx_pin));
  Serial.println("  Ignition Pin: " + String(ignition_input_pin));
}

void loadIntervalsFromNvs() {
  if (!preferences.begin(nvs_namespace, false)) {
    Serial.println("WARNING: Failed to open NVS intervals namespace; using defaults");
    return;
  }

  unsigned long savedIgnitionOnInterval = preferences.getULong(
    nvs_ignition_on_interval_key,
    ignitionOnPollIntervalMs
  );
  unsigned long savedIgnitionOffInterval = preferences.getULong(
    nvs_ignition_off_interval_key,
    ignitionOffPollIntervalMs
  );
  preferences.end();

  if (isValidTelemetryInterval(savedIgnitionOnInterval)) {
    ignitionOnPollIntervalMs = savedIgnitionOnInterval;
  } else {
    Serial.println("WARNING: Ignoring invalid NVS ignition ON interval: " + String(savedIgnitionOnInterval));
  }

  if (isValidTelemetryInterval(savedIgnitionOffInterval)) {
    ignitionOffPollIntervalMs = savedIgnitionOffInterval;
  } else {
    Serial.println("WARNING: Ignoring invalid NVS ignition OFF interval: " + String(savedIgnitionOffInterval));
  }
}

bool saveIntervalsToNvs(unsigned long ignitionOnIntervalMs, unsigned long ignitionOffIntervalMs) {
  if (!preferences.begin(nvs_namespace, false)) {
    Serial.println("ERROR: Failed to open NVS for writing intervals");
    return false;
  }

  size_t writtenOn = preferences.putULong(nvs_ignition_on_interval_key, ignitionOnIntervalMs);
  size_t writtenOff = preferences.putULong(nvs_ignition_off_interval_key, ignitionOffIntervalMs);
  preferences.end();

  if (writtenOn == 0 || writtenOff == 0) {
    Serial.println("ERROR: Failed to persist one or more telemetry intervals to NVS");
    return false;
  }

  return true;
}

bool isValidTelemetryInterval(unsigned long intervalMs) {
  return intervalMs >= minTelemetryIntervalMs && intervalMs <= maxTelemetryIntervalMs;
}

bool startGps() {
  String response = readATResponse("AT+QGPS=1", 3000);
  logModemResponse("AT+QGPS=1 response", response);

  if (responseContainsSuccess(response, "OK")) {
    return true;
  }

  if (response.indexOf("+CME ERROR") >= 0) {
    Serial.println("GNSS may already be running or temporarily busy; QGPSLOC will confirm on poll");
  }

  return false;
}

void handleGpsPollFailure(const String& gpsResponse) {
  consecutiveGpsFailures++;

  Serial.println("No GPS telemetry sample from AT+QGPSLOC? attempt " + String(consecutiveGpsFailures));
  if (gpsResponse.length() > 0) {
    logModemResponse("AT+QGPSLOC? response", gpsResponse);
  } else {
    Serial.println("AT+QGPSLOC? response: no response from modem");
  }

  if (consecutiveGpsFailures >= gps_restart_after_failures) {
    Serial.println("Restarting GNSS after repeated missing GPS samples");
    sendAT("AT+QGPSEND", 2000);
    delay(500);
    startGps();
    consecutiveGpsFailures = 0;
  }
}

bool setupLTE() {
  Serial.println("Setting up LTE...");

  if (!waitForModemReady(modem_ready_timeout_ms)) {
    Serial.println("ERROR: Modem did not respond to AT within startup window.");
    return false;
  }

  sendAT("ATE0");

  if (!waitForSimReady(sim_ready_timeout_ms)) {
    Serial.println("ERROR: SIM is not ready yet.");
    return false;
  }

  String response = readATResponse("AT+CSQ", 2000);
  logModemResponse("AT+CSQ response", response);

  if (!waitForNetworkRegistration(network_registration_timeout_ms)) {
    Serial.println("ERROR: Modem is not registered on the network yet.");
    return false;
  }

  if (!waitForGprsAttach(gprs_attach_timeout_ms)) {
    Serial.println("ERROR: Modem is not packet-data attached yet.");
    return false;
  }

  if (!validateApnConfig()) {
    return false;
  }

  response = readATResponse("AT+CGDCONT=1,\"IP\",\"" + String(apn) + "\"", 3000);
  logModemResponse("AT+CGDCONT response", response);
  if (!responseContainsSuccess(response, "OK")) {
    Serial.println("ERROR: Failed to configure APN before PDP activation.");
    return false;
  }

  const int pdpActivationAttempts = 3;
  const unsigned long pdpActivationTimeoutMs = 15000;
  const unsigned long pdpRetryDelayMs[pdpActivationAttempts] = {2000, 3000, 5000};

  for (int attempt = 0; attempt < pdpActivationAttempts; attempt++) {
    String activeContextResponse = readATResponse("AT+QIACT?", 5000);
    logModemResponse("AT+QIACT? response before activation", activeContextResponse);
    if (responseContainsActivePdpContext(activeContextResponse)) {
      Serial.println("LTE Ready");
      lteReady = true;
      return true;
    }

    Serial.println("Activating PDP context...");
    response = readATResponse("AT+QIACT=1", pdpActivationTimeoutMs);
    logModemResponse("AT+QIACT response", response);

    if (responseContainsPdpActivation(response)) {
      Serial.println("LTE Ready");
      lteReady = true;
      return true;
    }

    Serial.println("ERROR: PDP activation did not return an active context.");

    String deactivateResponse = readATResponse("AT+QIDEACT=1", 5000);
    logModemResponse("AT+QIDEACT response", deactivateResponse);

    if (attempt < pdpActivationAttempts - 1) {
      Serial.println("Retrying PDP activation...");
      delay(pdpRetryDelayMs[attempt]);
    }
  }

  Serial.println("ERROR: PDP activation failed after maximum retries.");
  lteReady = false;
  return false;
}

String buildMqttClientId() {
  return String(mqtt_client_prefix) + getDeviceImei();
}

String getDeviceImei() {
  if (cachedDeviceImei.length() > 0) {
    return cachedDeviceImei;
  }

  String imei = readImei();
  if (imei.length() > 0) {
    cachedDeviceImei = imei;
    return cachedDeviceImei;
  }

  String fallbackImei = String(configured_device_imei);
  if (fallbackImei.length() > 0) {
    cachedDeviceImei = fallbackImei;
  }

  return fallbackImei;
}

String buildTelemetryTopic() {
  return "vts/devices/" + getDeviceImei() + "/telemetry";
}

String buildIdentityTopic() {
  return "vts/devices/" + getDeviceImei() + "/identity";
}

String buildCommandTopic() {
  return "vts/devices/" + getDeviceImei() + "/commands";
}

String buildAckTopic() {
  return "vts/devices/" + getDeviceImei() + "/ack";
}

bool connectMQTT() {
  if (!validateMqttBrokerConfig()) {
    mqttConnected = false;
    return false;
  }

  String pdpStatusResponse = readATResponse("AT+QIACT?", 5000);
  logModemResponse("AT+QIACT? response before MQTT", pdpStatusResponse);
  if (!responseContainsActivePdpContext(pdpStatusResponse)) {
    Serial.println("PDP context is not active. Re-establishing LTE before MQTT...");
    lteReady = setupLTE();
    if (!lteReady) {
      Serial.println("MQTT skipped because PDP activation is not ready.");
      mqttConnected = false;
      return false;
    }
  }

  Serial.println("Connecting MQTT...");
  Serial.println("MQTT Broker: " + String(mqtt_broker) + ":" + String(mqtt_port));
  Serial.println("MQTT Client: " + buildMqttClientId());
  Serial.println("Telemetry Topic: " + buildTelemetryTopic());
  Serial.println("Identity Topic: " + buildIdentityTopic());

  closeMqttSession();

  String openCommand = "AT+QMTOPEN=0,\"" + String(mqtt_broker) + "\"," + String(mqtt_port);
  String openResponse = readATResponseUntil(openCommand, "+QMTOPEN:", mqtt_open_timeout_ms);
  logModemResponse("AT+QMTOPEN response", openResponse);
  if (responseContainsMqttClientOccupied(openResponse)) {
    Serial.println("MQTT client index is occupied; closing stale MQTT session and retrying open");
    closeMqttSession();
    delay(1000);
    openResponse = readATResponseUntil(openCommand, "+QMTOPEN:", mqtt_open_timeout_ms);
    logModemResponse("AT+QMTOPEN retry response", openResponse);
  }

  bool openSucceeded = responseContainsMqttOpenSuccess(openResponse);
  if (!openSucceeded) {
    logModemResponse("MQTT open failed", openResponse);
    closeMqttSession();
    mqttConnected = false;
    return false;
  }

  String connectCommand = "AT+QMTCONN=0,\"" + buildMqttClientId() + "\"";
  if (hasMqttCredentials()) {
    connectCommand += ",\"" + String(mqtt_username) + "\",\"" + String(mqtt_password) + "\"";
  }

  String connectResponse = readATResponseUntil(connectCommand, "+QMTCONN:", mqtt_connect_timeout_ms);
  logModemResponse("AT+QMTCONN response", connectResponse);
  if (!responseContainsSuccess(connectResponse, "+QMTCONN: 0,0,0")) {
    logModemResponse("MQTT connect failed", connectResponse);
    closeMqttSession();
    mqttConnected = false;
    return false;
  }

  mqttConnected = true;
  Serial.println("MQTT connected");

  String subscribeCommand = "AT+QMTSUB=0,1,\"" + buildCommandTopic() + "\",1";
  String subscribeResponse = readATResponseUntil(subscribeCommand, "+QMTSUB:", mqtt_connect_timeout_ms);
  logModemResponse("AT+QMTSUB response", subscribeResponse);
  if (!responseContainsSuccess(subscribeResponse, "+QMTSUB: 0,1,0")) {
    Serial.println("MQTT subscribe failed for command topic: " + buildCommandTopic());
    closeMqttSession();
    mqttConnected = false;
    return false;
  }

  Serial.println("Subscribed to command topic: " + buildCommandTopic());

  if (!publishRawMessage(buildIdentityTopic(), buildIdentityJson())) {
    Serial.println("Identity publish failed after MQTT connect");
    closeMqttSession();
    mqttConnected = false;
    return false;
  }

  return true;
}

void maintainConnectivity() {
  unsigned long now = millis();

  if (now - lastConnectivityMaintenanceAtMs >= connectivity_maintenance_interval_ms) {
    lastConnectivityMaintenanceAtMs = now;

    if (!lteReady) {
      Serial.println("LTE not ready; running background LTE setup");
      lteReady = setupLTE();
      if (lteReady) {
        nextMqttReconnectAtMs = 0;
      }
    }
  }

  if (lteReady && !startupSmsSent && now >= nextStartupSmsAtMs) {
    startupSmsSent = sendStartupSMS();
    nextStartupSmsAtMs = now + startup_sms_retry_interval_ms;
  }

  if (lteReady && !mqttConnected && now >= nextMqttReconnectAtMs) {
    Serial.println("MQTT not connected; running scheduled reconnect");
    if (!connectMQTT()) {
      nextMqttReconnectAtMs = millis() + mqtt_reconnect_interval_ms;
    } else {
      nextMqttReconnectAtMs = 0;
    }
  }
}

void closeMqttSession() {
  String disconnectResponse = readATResponseUntil("AT+QMTDISC=0", "+QMTDISC:", 3000);
  if (disconnectResponse.length() > 0 && disconnectResponse.indexOf("ERROR") < 0) {
    logModemResponse("AT+QMTDISC cleanup response", disconnectResponse);
  }

  String closeResponse = readATResponseUntil("AT+QMTCLOSE=0", "+QMTCLOSE:", 5000);
  if (closeResponse.length() > 0 && closeResponse.indexOf("ERROR") < 0) {
    logModemResponse("AT+QMTCLOSE cleanup response", closeResponse);
  }

  mqttConnected = false;
}

bool ensureMqttConnected() {
  if (mqttConnected) {
    return true;
  }

  unsigned long now = millis();
  if (now < nextMqttReconnectAtMs) {
    return false;
  }

  Serial.println("Attempting MQTT reconnect...");
  if (connectMQTT()) {
    nextMqttReconnectAtMs = 0;
    return true;
  }

  nextMqttReconnectAtMs = millis() + mqtt_reconnect_interval_ms;
  return false;
}

bool publishRawMessage(const String& topic, const String& msg) {
  clearModemInput();
  sim.println("AT+QMTPUB=0,0,0,0,\"" + topic + "\"");

  String promptResponse = readModemUntilQuiet(mqtt_publish_prompt_timeout_ms, 100);
  if (promptResponse.indexOf('>') < 0) {
    logModemResponse("MQTT publish prompt failed", promptResponse);
    closeMqttSession();
    mqttConnected = false;
    return false;
  }

  sim.print(msg);
  sim.write(0x1A);

  String publishResponse = readModemUntilPattern("+QMTPUB:", mqtt_publish_ack_timeout_ms);
  if (!responseContainsSuccess(publishResponse, "+QMTPUB: 0,0,0")) {
    logModemResponse("MQTT publish ack failed", publishResponse);
    closeMqttSession();
    mqttConnected = false;
    return false;
  }

  Serial.println("Message published to MQTT topic: " + topic);
  return true;
}

void processIncomingMqttMessages(const String& modemOutput) {
  if (modemOutput.indexOf("+QMTSTAT:") >= 0) {
    Serial.println("MQTT status notification from modem:");
    Serial.println(modemOutput);
    mqttConnected = false;
  }

  if (modemOutput.indexOf("+QMTRECV:") < 0) {
    return;
  }

  Serial.println("Incoming modem output:");
  Serial.println(modemOutput);

  int searchStart = 0;
  while (searchStart < modemOutput.length()) {
    int messageStart = modemOutput.indexOf("+QMTRECV:", searchStart);
    if (messageStart < 0) {
      break;
    }

    int cursor = modemOutput.indexOf(':', messageStart);
    if (cursor < 0) {
      Serial.println("Ignoring malformed +QMTRECV line: missing ':'");
      break;
    }

    cursor++;
    String topic;
    String payload;

    if (!extractQuotedField(modemOutput, cursor, topic)) {
      Serial.println("Ignoring malformed +QMTRECV line: topic parse failed");
      searchStart = messageStart + 9;
      continue;
    }

    if (!extractQmtRecvPayload(modemOutput, cursor, payload)) {
      Serial.println("Ignoring malformed +QMTRECV line: payload parse failed");
      searchStart = messageStart + 9;
      continue;
    }

    searchStart = cursor;

    if (topic != buildCommandTopic()) {
      Serial.println("Ignoring MQTT message on unexpected topic: " + topic);
      continue;
    }

    payload.trim();
    Serial.println("MQTT command topic: " + topic);
    Serial.println("MQTT command payload: " + payload);
    handleCommand(payload);
  }
}

void enqueueMessage(const String& topic, const String& payload) {
  if (queueCount == telemetry_queue_capacity) {
    Serial.println("Telemetry queue full; evicting oldest message");
    popQueuedMessage();
  }

  int tail = (queueHead + queueCount) % telemetry_queue_capacity;
  telemetryQueue[tail].topic = topic;
  telemetryQueue[tail].payload = payload;
  queueCount++;

  Serial.println("Queued telemetry count: " + String(queueCount));
}

bool queueIsEmpty() {
  return queueCount == 0;
}

QueuedMessage peekQueuedMessage() {
  return telemetryQueue[queueHead];
}

void popQueuedMessage() {
  if (queueCount == 0) {
    return;
  }

  telemetryQueue[queueHead].topic = "";
  telemetryQueue[queueHead].payload = "";
  queueHead = (queueHead + 1) % telemetry_queue_capacity;
  queueCount--;
}

int queuedMessageCount() {
  return queueCount;
}

bool flushQueuedMessages() {
  if (queueIsEmpty()) {
    return true;
  }

  if (!ensureMqttConnected()) {
    return false;
  }

  Serial.println("Flushing queued telemetry: " + String(queuedMessageCount()));
  while (!queueIsEmpty()) {
    QueuedMessage message = peekQueuedMessage();
    if (!publishRawMessage(message.topic, message.payload)) {
      Serial.println("Queue flush stopped; will retry later");
      return false;
    }

    popQueuedMessage();
  }

  Serial.println("Queued telemetry flush complete");
  return true;
}

bool publishMessage(const String& topic, const String& msg) {
  if (!ensureMqttConnected()) {
    enqueueMessage(topic, msg);
    return false;
  }

  if (!queueIsEmpty() && !flushQueuedMessages()) {
    enqueueMessage(topic, msg);
    return false;
  }

  if (!publishRawMessage(topic, msg)) {
    enqueueMessage(topic, msg);
    return false;
  }

  return true;
}

// ----------------------
// Send startup SMS
// ----------------------
bool sendStartupSMS() {
  Serial.println("Sending startup SMS...");
  String modeResponse = readATResponse("AT+CMGF=1", 2000);
  if (!responseContainsSuccess(modeResponse, "OK")) {
    logModemResponse("AT+CMGF failed", modeResponse);
    return false;
  }

  clearModemInput();
  sim.println("AT+CMGS=\"" + String(notify_number) + "\"");
  String promptResponse = readModemUntilQuiet(5000, 100);
  if (promptResponse.indexOf('>') < 0) {
    logModemResponse("AT+CMGS prompt failed", promptResponse);
    return false;
  }

  sim.print("Device IMEI " + getDeviceImei() + " started");
  sim.write(0x1A);
  String sendResponse = readModemUntilPattern("OK", 10000);
  if (!responseContainsSuccess(sendResponse, "OK") && sendResponse.indexOf("+CMGS:") < 0) {
    logModemResponse("Startup SMS send failed", sendResponse);
    return false;
  }

  Serial.println("Startup SMS sent");
  return true;
}

// ----------------------
// Telemetry builders
// ----------------------
bool parseGPS(const String& rawInput, TelemetrySample& sample) {
  String raw = rawInput;
  raw.replace("+QGPSLOC: ", "");

  String fields[12];
  int start = 0;
  int fieldCount = 0;
  for (int i = 0; i < raw.length() && fieldCount < 12; i++) {
    if (raw[i] == ',' || i == raw.length() - 1) {
      int end = (i == raw.length() - 1) ? i + 1 : i;
      fields[fieldCount++] = raw.substring(start, end);
      start = i + 1;
    }
  }

  String utc = (fieldCount > 0) ? fields[0] : "";
  String lat = (fieldCount > 1) ? fields[1] : "";
  String lon = (fieldCount > 2) ? fields[2] : "";
  String speed = (fieldCount > 7) ? fields[7] : "0";
  String date = (fieldCount > 9) ? fields[9] : "";

  if (lat.length() == 0 || lon.length() == 0) {
    return false;
  }

  sample.timestampMs = resolveTimestampMs(utc, date);
  sample.hasIsoTimestamp = tryBuildIsoTimestamp(utc, date, sample.timestampIso);
  sample.lat = parseLatLon(lat);
  sample.lng = parseLatLon(lon);
  sample.speedKmh = speed.toFloat();
  sample.ignition = false;
  sample.batteryMv = lastKnownBatteryMv;
  sample.signalDbm = lastKnownSignalDbm;

  return true;
}

String buildTelemetryJson(const TelemetrySample& sample) {
  String json = "{";
  json += "\"imei_no\":\"" + getDeviceImei() + "\",";
  if (sample.hasIsoTimestamp) {
    json += "\"timestamp\":\"" + sample.timestampIso + "\",";
  }
  json += "\"lat\":" + String(sample.lat, 6) + ",";
  json += "\"lon\":" + String(sample.lng, 6) + ",";
  json += "\"speed_kmph\":" + String(sample.speedKmh, 1) + ",";
  json += "\"ignition\":" + String(sample.ignition ? "true" : "false") + ",";
  json += "\"battery_mv\":" + String(sample.batteryMv) + ",";
  json += "\"signal_dbm\":" + String(sample.signalDbm);
  json += "}";
  return json;
}

String buildIdentityJson() {
  String json = "{";
  json += "\"type\":\"identity\",";
  json += "\"imei_no\":\"" + getDeviceImei() + "\",";
  json += "\"imsi\":\"" + readImsi() + "\",";
  json += "\"firmwareVersion\":\"" + String(firmware_version) + "\"";
  json += "}";
  return json;
}

String buildAckJson(unsigned long ignitionOnIntervalMs, unsigned long ignitionOffIntervalMs) {
  String json = "{";
  json += "\"type\":\"ack\",";
  json += "\"status\":\"success\",";
  json += "\"ignitionOnInterval\":" + String(ignitionOnIntervalMs) + ",";
  json += "\"ignitionOffInterval\":" + String(ignitionOffIntervalMs);
  json += "}";
  return json;
}

void handleCommand(const String& payload) {
  if (payload.length() == 0) {
    Serial.println("Ignoring empty MQTT command payload");
    return;
  }

  String commandType;
  if (!extractJsonStringValue(payload, "type", commandType)) {
    Serial.println("Ignoring MQTT command: missing type field");
    return;
  }

  if (commandType != "config_update") {
    Serial.println("Ignoring unsupported MQTT command type: " + commandType);
    return;
  }

  unsigned long requestedIgnitionOnIntervalMs = 0;
  unsigned long requestedIgnitionOffIntervalMs = 0;
  bool hasIgnitionOnInterval = extractJsonUnsignedLongValue(
    payload,
    "ignitionOnInterval",
    requestedIgnitionOnIntervalMs
  );
  bool hasIgnitionOffInterval = extractJsonUnsignedLongValue(
    payload,
    "ignitionOffInterval",
    requestedIgnitionOffIntervalMs
  );

  if (!hasIgnitionOnInterval || !hasIgnitionOffInterval) {
    unsigned long legacyIntervalMs = 0;
    if (!extractJsonUnsignedLongValue(payload, "interval", legacyIntervalMs)) {
      Serial.println("Ignoring config_update: missing or invalid ignition intervals");
      return;
    }

    requestedIgnitionOnIntervalMs = legacyIntervalMs;
    requestedIgnitionOffIntervalMs = legacyIntervalMs;
  }

  if (!isValidTelemetryInterval(requestedIgnitionOnIntervalMs) ||
      !isValidTelemetryInterval(requestedIgnitionOffIntervalMs)) {
    Serial.println(
      "Ignoring config_update: interval out of range (on=" +
      String(requestedIgnitionOnIntervalMs) +
      " ms, off=" +
      String(requestedIgnitionOffIntervalMs) +
      " ms)"
    );
    return;
  }

  ignitionOnPollIntervalMs = requestedIgnitionOnIntervalMs;
  ignitionOffPollIntervalMs = requestedIgnitionOffIntervalMs;

  if (!saveIntervalsToNvs(ignitionOnPollIntervalMs, ignitionOffPollIntervalMs)) {
    Serial.println("Ignoring config_update because NVS persistence failed");
    return;
  }

  Serial.println(
    "Telemetry intervals updated to ignition ON " +
    String(ignitionOnPollIntervalMs) +
    " ms, ignition OFF " +
    String(ignitionOffPollIntervalMs) +
    " ms"
  );

  String ackTopic = buildAckTopic();
  String ackPayload = buildAckJson(ignitionOnPollIntervalMs, ignitionOffPollIntervalMs);
  Serial.println("Publishing ACK topic: " + ackTopic);
  Serial.println("Publishing ACK payload: " + ackPayload);
  if (!publishMessage(ackTopic, ackPayload)) {
    Serial.println("ACK publish failed; payload queued for retry");
  }
}

String readImsi() {
  String response = readATResponse("AT+CIMI", 2000);
  String digits = "";
  for (int i = 0; i < response.length(); i++) {
    char c = response.charAt(i);
    if (c >= '0' && c <= '9') {
      digits += c;
    }
  }

  if (digits.length() > 0) {
    return digits;
  }

  // TODO: replace this fallback once modem identity retrieval is validated on the target hardware.
  return "unknown-imsi";
}

String readImei() {
  String response = readATResponse("AT+CGSN", 2000);
  String digits = "";
  for (int i = 0; i < response.length(); i++) {
    char c = response.charAt(i);
    if (c >= '0' && c <= '9') {
      digits += c;
    }
  }

  return digits.length() > 0 ? digits : "";
}

String uint64ToString(uint64_t value) {
  char buffer[32];
  snprintf(buffer, sizeof(buffer), "%llu", static_cast<unsigned long long>(value));
  return String(buffer);
}

bool tryBuildIsoTimestamp(const String& utc, const String& date, String& isoTimestamp) {
  if (utc.length() < 6 || date.length() != 6) {
    isoTimestamp = "";
    return false;
  }

  int dotIndex = utc.indexOf('.');
  String hhmmss = dotIndex >= 0 ? utc.substring(0, dotIndex) : utc;
  String fractional = dotIndex >= 0 ? utc.substring(dotIndex + 1) : "000";

  if (hhmmss.length() < 6) {
    isoTimestamp = "";
    return false;
  }

  while (fractional.length() < 3) {
    fractional += "0";
  }
  if (fractional.length() > 3) {
    fractional = fractional.substring(0, 3);
  }

  int day = date.substring(0, 2).toInt();
  int month = date.substring(2, 4).toInt();
  int year = 2000 + date.substring(4, 6).toInt();
  int hour = hhmmss.substring(0, 2).toInt();
  int minute = hhmmss.substring(2, 4).toInt();
  int second = hhmmss.substring(4, 6).toInt();

  if (day <= 0 || month <= 0 || month > 12 || hour > 23 || minute > 59 || second > 59) {
    isoTimestamp = "";
    return false;
  }

  char buffer[32];
  snprintf(
    buffer,
    sizeof(buffer),
    "%04d-%02d-%02dT%02d:%02d:%02d.%sZ",
    year,
    month,
    day,
    hour,
    minute,
    second,
    fractional.c_str()
  );
  isoTimestamp = String(buffer);
  return true;
}

bool extractQuotedField(const String& input, int& cursor, String& value) {
  while (cursor < input.length() && input.charAt(cursor) != '"') {
    cursor++;
  }

  if (cursor >= input.length()) {
    return false;
  }

  cursor++;
  value = "";
  bool escapeNext = false;

  while (cursor < input.length()) {
    char c = input.charAt(cursor++);
    if (escapeNext) {
      value += c;
      escapeNext = false;
      continue;
    }

    if (c == '\\') {
      escapeNext = true;
      continue;
    }

    if (c == '"') {
      return true;
    }

    value += c;
  }

  return false;
}

bool extractQmtRecvPayload(const String& input, int& cursor, String& value) {
  while (cursor < input.length() && input.charAt(cursor) != '"') {
    cursor++;
  }

  if (cursor >= input.length()) {
    return false;
  }

  cursor++;
  int payloadStart = cursor;

  while (payloadStart < input.length() && isspace(static_cast<unsigned char>(input.charAt(payloadStart)))) {
    payloadStart++;
  }

  if (payloadStart >= input.length()) {
    return false;
  }

  char opening = input.charAt(payloadStart);
  if (opening != '{' && opening != '[') {
    return extractQuotedField(input, cursor, value);
  }

  char closing = opening == '{' ? '}' : ']';
  int depth = 0;
  bool inString = false;
  bool escapeNext = false;

  for (int i = payloadStart; i < input.length(); i++) {
    char c = input.charAt(i);

    if (inString) {
      if (escapeNext) {
        escapeNext = false;
        continue;
      }

      if (c == '\\') {
        escapeNext = true;
        continue;
      }

      if (c == '"') {
        inString = false;
      }
      continue;
    }

    if (c == '"') {
      inString = true;
      continue;
    }

    if (c == opening) {
      depth++;
      continue;
    }

    if (c == closing) {
      depth--;
      if (depth == 0) {
        value = input.substring(cursor, i + 1);
        cursor = i + 1;
        while (cursor < input.length() && isspace(static_cast<unsigned char>(input.charAt(cursor)))) {
          cursor++;
        }

        if (cursor < input.length() && input.charAt(cursor) == '"') {
          cursor++;
          return true;
        }

        return false;
      }
    }
  }

  return false;
}

bool extractJsonStringValue(const String& json, const String& key, String& value) {
  String pattern = "\"" + key + "\"";
  int keyIndex = json.indexOf(pattern);
  if (keyIndex < 0) {
    return false;
  }

  int colonIndex = json.indexOf(':', keyIndex + pattern.length());
  if (colonIndex < 0) {
    return false;
  }

  int cursor = colonIndex + 1;
  while (cursor < json.length() && isspace(static_cast<unsigned char>(json.charAt(cursor)))) {
    cursor++;
  }

  return extractQuotedField(json, cursor, value);
}

bool extractJsonUnsignedLongValue(const String& json, const String& key, unsigned long& value) {
  String pattern = "\"" + key + "\"";
  int keyIndex = json.indexOf(pattern);
  if (keyIndex < 0) {
    return false;
  }

  int colonIndex = json.indexOf(':', keyIndex + pattern.length());
  if (colonIndex < 0) {
    return false;
  }

  int start = colonIndex + 1;
  while (start < json.length() && isspace(static_cast<unsigned char>(json.charAt(start)))) {
    start++;
  }

  int end = start;
  while (end < json.length() && isdigit(json.charAt(end))) {
    end++;
  }

  if (start == end) {
    return false;
  }

  value = static_cast<unsigned long>(json.substring(start, end).toInt());
  return true;
}

// ----------------------
// Hardware / modem signals
// ----------------------
bool readIgnitionState() {
  if (ignition_input_pin >= 0) {
    return digitalRead(ignition_input_pin) == HIGH;
  }

  // TODO: replace this fallback with a real ignition input before production deployment.
  return ignition_fallback_state;
}

int readSignalDbm() {
  String response = readATResponse("AT+CSQ", 1000);
  int marker = response.indexOf("+CSQ:");
  if (marker < 0) {
    return lastKnownSignalDbm;
  }

  int comma = response.indexOf(',', marker);
  if (comma < 0) {
    return lastKnownSignalDbm;
  }

  String rssiText = response.substring(marker + 5, comma);
  rssiText.trim();
  int rssi = rssiText.toInt();
  if (rssi < 0 || rssi == 99) {
    return lastKnownSignalDbm;
  }

  lastKnownSignalDbm = -113 + (2 * rssi);
  return lastKnownSignalDbm;
}

int readBatteryMillivolts() {
  String response = readATResponse("AT+CBC", 1000);
  int marker = response.indexOf("+CBC:");
  if (marker < 0) {
    // TODO: keep this fallback only until battery telemetry is verified on the installed modem.
    return lastKnownBatteryMv;
  }

  int firstComma = response.indexOf(',', marker);
  int secondComma = response.indexOf(',', firstComma + 1);
  if (firstComma < 0 || secondComma < 0) {
    return lastKnownBatteryMv;
  }

  String voltageText = response.substring(secondComma + 1);
  int lineBreak = voltageText.indexOf('\n');
  if (lineBreak >= 0) {
    voltageText = voltageText.substring(0, lineBreak);
  }
  voltageText.trim();

  int voltageMv = voltageText.toInt();
  if (voltageMv > 0) {
    lastKnownBatteryMv = voltageMv;
  }

  return lastKnownBatteryMv;
}

// ----------------------
// Time helpers
// ----------------------
uint64_t resolveTimestampMs(const String& utcInput, const String& dateInput) {
  String utc = utcInput;
  String date = dateInput;
  utc.trim();
  date.trim();

  if (utc.length() < 6 || date.length() < 6) {
    // TODO: replace this fallback with modem or GNSS-synced epoch time if QGPSLOC time is unavailable.
    return fallbackTimestampMs();
  }

  int day = date.substring(0, 2).toInt();
  int month = date.substring(2, 4).toInt();
  int year = 2000 + date.substring(4, 6).toInt();

  int hour = utc.substring(0, 2).toInt();
  int minute = utc.substring(2, 4).toInt();
  int second = utc.substring(4, 6).toInt();

  int millisecond = 0;
  int dot = utc.indexOf('.');
  if (dot >= 0) {
    String fraction = utc.substring(dot + 1);
    while (fraction.length() < 3) {
      fraction += "0";
    }
    if (fraction.length() > 3) {
      fraction = fraction.substring(0, 3);
    }
    millisecond = fraction.toInt();
  }

  if (year < 2020 || month < 1 || month > 12 || day < 1 || day > 31) {
    return fallbackTimestampMs();
  }

  return epochMsFromDateTime(year, month, day, hour, minute, second, millisecond);
}

uint64_t epochMsFromDateTime(int year, int month, int day, int hour, int minute, int second, int millisecond) {
  uint64_t daysSinceEpoch = 0;
  for (int y = 1970; y < year; y++) {
    daysSinceEpoch += isLeapYear(y) ? 366 : 365;
  }

  for (int m = 1; m < month; m++) {
    daysSinceEpoch += daysInMonth(year, m);
  }

  daysSinceEpoch += static_cast<uint64_t>(day - 1);

  uint64_t secondsSinceEpoch = daysSinceEpoch * 86400ULL;
  secondsSinceEpoch += static_cast<uint64_t>(hour) * 3600ULL;
  secondsSinceEpoch += static_cast<uint64_t>(minute) * 60ULL;
  secondsSinceEpoch += static_cast<uint64_t>(second);

  return (secondsSinceEpoch * 1000ULL) + static_cast<uint64_t>(millisecond);
}

uint64_t fallbackTimestampMs() {
  return fallback_epoch_base_ms + static_cast<uint64_t>(millis());
}

bool isLeapYear(int year) {
  if (year % 400 == 0) {
    return true;
  }
  if (year % 100 == 0) {
    return false;
  }
  return year % 4 == 0;
}

int daysInMonth(int year, int month) {
  switch (month) {
    case 1:
    case 3:
    case 5:
    case 7:
    case 8:
    case 10:
    case 12:
      return 31;
    case 4:
    case 6:
    case 9:
    case 11:
      return 30;
    case 2:
      return isLeapYear(year) ? 29 : 28;
    default:
      return 30;
  }
}

// ----------------------
// GPS helpers
// ----------------------
float parseLatLon(String s) {
  if (s.length() < 2) {
    return 0.0f;
  }

  char dir = s.charAt(s.length() - 1);
  s = s.substring(0, s.length() - 1);

  int dot = s.indexOf('.');
  int degLen = (dot > 2) ? dot - 2 : 2;
  float degrees = s.substring(0, degLen).toFloat();
  float minutes = s.substring(degLen).toFloat();

  float decimalDegrees = degrees + (minutes / 60.0f);
  if (dir == 'S' || dir == 'W') {
    decimalDegrees = -decimalDegrees;
  }

  return decimalDegrees;
}
