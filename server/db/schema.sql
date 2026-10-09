CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100) NOT NULL, email VARCHAR(150) NOT NULL UNIQUE,
  id_number VARCHAR(50) NOT NULL, department VARCHAR(100) NOT NULL,
  role ENUM('administrator','technician','auditor','student') NOT NULL,
  status ENUM('pending','active','disabled') NOT NULL DEFAULT 'pending',
  password_hash VARCHAR(100) NOT NULL, failed_logins INT NOT NULL DEFAULT 0, locked_until DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS equipment (
  id INT AUTO_INCREMENT PRIMARY KEY, code VARCHAR(30) NOT NULL UNIQUE, name VARCHAR(150) NOT NULL,
  manufacturer VARCHAR(100), model VARCHAR(100), serial_number VARCHAR(100) NOT NULL UNIQUE,
  department VARCHAR(100), location VARCHAR(100), purchase_date DATE, installation_date DATE,
  calibration_frequency_days INT NOT NULL DEFAULT 365, measurement_range VARCHAR(100), accuracy VARCHAR(50),
  resolution VARCHAR(50), maintenance_interval_days INT DEFAULT 180, warranty_until DATE,
  usage_hours INT NOT NULL DEFAULT 0, operational_status ENUM('active','under_maintenance','retired') DEFAULT 'active',
  last_calibration_date DATE NULL, next_calibration_date DATE NULL,
  compliance_status ENUM('Calibrated','Due Soon','Expired') DEFAULT 'Expired', created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS calibrations (
  id INT AUTO_INCREMENT PRIMARY KEY, equipment_id INT NOT NULL, lab VARCHAR(100), agency VARCHAR(100),
  technician_id INT NOT NULL, certificate_no VARCHAR(60) NOT NULL, certificate_file VARCHAR(255),
  calibration_date DATE NOT NULL, tolerance DOUBLE NOT NULL, remarks TEXT, next_date DATE,
  max_dev_pct DOUBLE, cri INT, band VARCHAR(30), decision ENUM('accepted','pending_review','quarantined','rejected'),
  reviewed_by INT NULL, review_note TEXT, reviewed_at DATETIME NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (equipment_id) REFERENCES equipment(id), FOREIGN KEY (technician_id) REFERENCES users(id));
CREATE TABLE IF NOT EXISTS calibration_test_points (
  id INT AUTO_INCREMENT PRIMARY KEY, calibration_id INT NOT NULL, standard_value DOUBLE, measured_value DOUBLE,
  deviation DOUBLE, tolerance DOUBLE, within_tolerance BOOLEAN, FOREIGN KEY (calibration_id) REFERENCES calibrations(id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS calibration_checks (
  id INT AUTO_INCREMENT PRIMARY KEY, calibration_id INT NOT NULL, check_no TINYINT NOT NULL, name VARCHAR(60),
  weight INT, score INT, status ENUM('Passed','Warning','Failed'), reason VARCHAR(400),
  UNIQUE KEY uq_check (calibration_id, check_no), FOREIGN KEY (calibration_id) REFERENCES calibrations(id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS dcf_profiles (
  equipment_id INT PRIMARY KEY, n INT, mean_dev DOUBLE, std_dev DOUBLE, drift_slope DOUBLE,
  mean_interval DOUBLE, std_interval DOUBLE, FOREIGN KEY (equipment_id) REFERENCES equipment(id));
CREATE TABLE IF NOT EXISTS maintenance (
  id INT AUTO_INCREMENT PRIMARY KEY, equipment_id INT NOT NULL, date DATE NOT NULL, type VARCHAR(50),
  description TEXT, parts_replaced VARCHAR(255), performed_by INT, FOREIGN KEY (equipment_id) REFERENCES equipment(id));
CREATE TABLE IF NOT EXISTS alerts (
  id INT AUTO_INCREMENT PRIMARY KEY, equipment_id INT, type VARCHAR(30), message VARCHAR(300),
  dedupe_key VARCHAR(100) UNIQUE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS alert_reads (alert_id INT, user_id INT, PRIMARY KEY (alert_id, user_id));
CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, action VARCHAR(60), entity VARCHAR(40), entity_id INT,
  detail VARCHAR(400), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
