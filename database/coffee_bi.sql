-- ============================================================
--  CoffeeBI — Dump complet de la base de données
--  Projet PFE — ISMONTIC Tanger 2025 — Groupe PT47
--  Génération : 2026-06-27
-- ============================================================
--
--  INSTRUCTIONS D'INSTALLATION
--  ----------------------------
--  1. Ouvrez MySQL Workbench (ou la CLI mysql)
--  2. Exécutez ce fichier :
--       mysql -u root -p --port=3307 < coffee_bi.sql
--     OU importez-le via MySQL Workbench : Server > Data Import
--
--  3. Configurez le fichier coffeebi/backend/.env :
--       DB_USER=root
--       DB_PASSWORD=votre_mot_de_passe
--       DB_HOST=localhost
--       DB_PORT=3307        <-- adapter selon votre installation
--       DB_NAME=coffee_bi
--
--  COMPTE ADMINISTRATEUR PAR DÉFAUT
--  ----------------------------------
--       Email    : admin@coffeebi.ma
--       Mot de passe : coffee2024
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';
SET time_zone = '+00:00';

-- ------------------------------------------------------------
-- Base de données
-- ------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS `coffee_bi`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `coffee_bi`;

-- ============================================================
-- TABLE : user
-- ============================================================
DROP TABLE IF EXISTS `user`;
CREATE TABLE `user` (
  `userId`   INT          NOT NULL AUTO_INCREMENT,
  `name`     VARCHAR(100) NOT NULL,
  `email`    VARCHAR(150) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`userId`),
  UNIQUE KEY `uq_user_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Compte admin par défaut (mot de passe : coffee2024)
INSERT INTO `user` (`name`, `email`, `password`) VALUES
('Admin CoffeeBI', 'admin@coffeebi.ma', '$2b$12$a7qwst0QOpHJVBNDKgj7QOmdySnTNTKgsdSuNlGX5WkyZyAfZgksq');

-- ============================================================
-- TABLE : coffeetype
-- ============================================================
DROP TABLE IF EXISTS `coffeetype`;
CREATE TABLE `coffeetype` (
  `coffeeId`  INT          NOT NULL AUTO_INCREMENT,
  `name`      VARCHAR(100) NOT NULL,
  `category`  VARCHAR(50)  DEFAULT NULL,
  `basePrice` DOUBLE       DEFAULT NULL,
  PRIMARY KEY (`coffeeId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `coffeetype` (`coffeeId`, `name`, `category`, `basePrice`) VALUES
(1,  'Americano',           'Classique', 28.90),
(2,  'Americano with Milk', 'Classique', 33.80),
(3,  'Cappuccino',          'Lait',      35.76),
(4,  'Cocoa',               'Chocolat',  38.70),
(5,  'Cortado',             'Classique', 27.92),
(6,  'Espresso',            'Classique', 18.12),
(7,  'Hot Chocolate',       'Chocolat',  38.70),
(8,  'Latte',               'Lait',      38.70);

-- ============================================================
-- TABLE : paymentmode
-- ============================================================
DROP TABLE IF EXISTS `paymentmode`;
CREATE TABLE `paymentmode` (
  `paymentId` INT                  NOT NULL AUTO_INCREMENT,
  `type`      ENUM('card','cash')  NOT NULL,
  PRIMARY KEY (`paymentId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `paymentmode` (`paymentId`, `type`) VALUES
(1, 'cash'),
(2, 'card');

-- ============================================================
-- TABLE : client
-- ============================================================
DROP TABLE IF EXISTS `client`;
CREATE TABLE `client` (
  `clientId`    INT          NOT NULL AUTO_INCREMENT,
  `codeAnonyme` VARCHAR(100) DEFAULT NULL,
  PRIMARY KEY (`clientId`),
  UNIQUE KEY `uq_client_code` (`codeAnonyme`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABLE : coffeesale
-- ============================================================
DROP TABLE IF EXISTS `coffeesale`;
CREATE TABLE `coffeesale` (
  `saleId`       INT    NOT NULL AUTO_INCREMENT,
  `saleDate`     DATE   NOT NULL,
  `hour`         INT    NOT NULL,
  `amount`       DOUBLE NOT NULL,
  `coffeeId`     INT    NOT NULL,
  `paymentId`    INT    DEFAULT NULL,
  `clientId`     INT    DEFAULT NULL,
  `time_of_day`  VARCHAR(20) DEFAULT NULL,
  `month_name`   VARCHAR(20) DEFAULT NULL,
  `month_sort`   INT    DEFAULT NULL,
  `weekday_sort` INT    DEFAULT NULL,
  PRIMARY KEY (`saleId`),
  KEY `idx_sale_coffee`  (`coffeeId`),
  KEY `idx_sale_payment` (`paymentId`),
  KEY `idx_sale_client`  (`clientId`),
  KEY `idx_sale_date`    (`saleDate`),
  KEY `idx_sale_month`   (`month_name`),
  CONSTRAINT `fk_sale_coffee`  FOREIGN KEY (`coffeeId`)  REFERENCES `coffeetype`  (`coffeeId`),
  CONSTRAINT `fk_sale_payment` FOREIGN KEY (`paymentId`) REFERENCES `paymentmode` (`paymentId`),
  CONSTRAINT `fk_sale_client`  FOREIGN KEY (`clientId`)  REFERENCES `client`      (`clientId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Les données de ventes sont importées depuis le CSV
-- (voir section "IMPORT DES DONNÉES" plus bas)

-- ============================================================
-- TABLE : mlprediction
-- ============================================================
DROP TABLE IF EXISTS `mlprediction`;
CREATE TABLE `mlprediction` (
  `predictionId`   INT    NOT NULL AUTO_INCREMENT,
  `forecastDate`   DATE   NOT NULL,
  `predictedPrice` DOUBLE NOT NULL,
  `confidence`     DOUBLE DEFAULT NULL,
  `coffeeId`       INT    NOT NULL,
  `saleId`         INT    DEFAULT NULL,
  PRIMARY KEY (`predictionId`),
  KEY `idx_pred_coffee` (`coffeeId`),
  KEY `idx_pred_sale`   (`saleId`),
  CONSTRAINT `fk_pred_coffee` FOREIGN KEY (`coffeeId`) REFERENCES `coffeetype`  (`coffeeId`),
  CONSTRAINT `fk_pred_sale`   FOREIGN KEY (`saleId`)   REFERENCES `coffeesale`  (`saleId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABLE : report
-- ============================================================
DROP TABLE IF EXISTS `report`;
CREATE TABLE `report` (
  `reportId`    INT          NOT NULL AUTO_INCREMENT,
  `period`      VARCHAR(50)  NOT NULL,
  `totalSales`  DOUBLE       NOT NULL,
  `generatedBy` INT          DEFAULT NULL,
  `created_at`  DATETIME     DEFAULT CURRENT_TIMESTAMP,
  `notes`       TEXT         DEFAULT NULL,
  PRIMARY KEY (`reportId`),
  KEY `idx_report_user` (`generatedBy`),
  CONSTRAINT `fk_report_user` FOREIGN KEY (`generatedBy`) REFERENCES `user` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- IMPORT DES DONNÉES DE VENTES (depuis le CSV)
-- ============================================================
-- Les données de ventes ne sont pas incluses ici car elles
-- proviennent du fichier CSV source (dataprj_fixed.csv).
--
-- Pour importer les données :
--   1. Placez le fichier CSV dans le dossier accessible
--   2. Éditez coffeebi/backend/import_csv_to_db.py ligne 12 :
--        CSV_PATH = r"chemin\vers\votre\dataprj_fixed.csv"
--   3. Lancez le backend d'abord pour créer les tables :
--        cd coffeebi/backend
--        python main.py   (ou uvicorn main:app)
--   4. Exécutez le script d'import :
--        python import_csv_to_db.py
--
-- OU utilisez directement ce fichier SQL pour créer la structure,
-- puis lancez le script d'import Python.
-- ============================================================
