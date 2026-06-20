/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19-11.8.2-MariaDB, for osx10.18 (arm64)
--
-- Host: localhost    Database: shop_game
-- ------------------------------------------------------
-- Server version	11.8.2-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*M!100616 SET @OLD_NOTE_VERBOSITY=@@NOTE_VERBOSITY, NOTE_VERBOSITY=0 */;

--
-- Table structure for table `danh_muc_tai_khoan`
--

DROP TABLE IF EXISTS `danh_muc_tai_khoan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `danh_muc_tai_khoan` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `noidung` longtext DEFAULT NULL,
  `type` varchar(50) DEFAULT NULL COMMENT 'example: muanick, random',
  `status` tinyint(4) NOT NULL DEFAULT 1 COMMENT '0=hidden,1=visible',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_danh_muc_status` (`status`),
  KEY `idx_danh_muc_type` (`type`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `danh_muc_tai_khoan`
--

LOCK TABLES `danh_muc_tai_khoan` WRITE;
/*!40000 ALTER TABLE `danh_muc_tai_khoan` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `danh_muc_tai_khoan` VALUES
(3,'ACC LIÊN QUÂN TỰ CHỌN','Tự chọn tài khoản mình yêu thích','tuchon',1,'2026-06-17 19:04:20','2026-06-17 19:04:20'),
(4,'TÚI MÙ ĐEN THÔNG TIN','Túi mù trải nghiệm nhiều SSS & hợp tác','tuimudenthongtin',1,'2026-06-17 19:05:02','2026-06-17 23:50:26'),
(5,'TÚI MÙ TRẮNG THÔNG TIN','Túi mù có thể đổi được mật khẩu và thông tin','tuimutrangthongtin',1,'2026-06-17 19:05:27','2026-06-17 23:49:52');
/*!40000 ALTER TABLE `danh_muc_tai_khoan` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `history_log`
--

DROP TABLE IF EXISTS `history_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `history_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `noidung` longtext DEFAULT NULL,
  `ip` varchar(45) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_history_log_user_id` (`user_id`),
  KEY `idx_history_log_created_at` (`created_at`),
  CONSTRAINT `fk_history_log_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=60 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `history_log`
--

LOCK TABLES `history_log` WRITE;
/*!40000 ALTER TABLE `history_log` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `history_log` VALUES
(1,1,'Đăng nhập thành công','::1','2026-06-17 12:49:51'),
(2,1,'Đăng nhập thành công','::1','2026-06-17 13:05:13'),
(3,1,'Đăng nhập thành công','::1','2026-06-17 13:07:52'),
(4,1,'Đăng nhập thành công','::1','2026-06-17 13:10:07'),
(5,1,'Đăng nhập thành công','::1','2026-06-17 13:11:14'),
(6,1,'Đăng nhập thành công','::1','2026-06-17 17:29:51'),
(7,1,'Đăng nhập thành công','::1','2026-06-17 17:39:03'),
(8,3,'Đăng nhập thành công','::1','2026-06-17 17:46:05'),
(9,1,'Đăng nhập thành công','::1','2026-06-17 17:49:51'),
(10,1,'Đăng nhập thành công','::1','2026-06-17 17:50:27'),
(11,1,'Đăng nhập thành công','::1','2026-06-17 17:53:10'),
(12,1,'Đăng nhập thành công','::1','2026-06-17 17:55:46'),
(13,1,'Đăng nhập thành công','::1','2026-06-17 18:24:39'),
(14,1,'Đăng nhập thành công','::1','2026-06-17 18:26:04'),
(15,3,'Đăng nhập thành công','::1','2026-06-17 18:27:03'),
(16,1,'Đăng nhập thành công','::1','2026-06-17 18:40:26'),
(17,3,'Đăng nhập thành công','::ffff:192.168.0.102','2026-06-17 18:47:48'),
(18,1,'Đăng nhập thành công','::ffff:192.168.0.102','2026-06-17 18:48:17'),
(19,1,'Cập nhật ngân hàng ID 2','::ffff:192.168.0.102','2026-06-17 18:48:44'),
(20,1,'Cập nhật ngân hàng ID 1','::ffff:192.168.0.102','2026-06-17 18:48:49'),
(21,1,'Admin admin123 cập nhật cấu hình website','::ffff:192.168.0.102','2026-06-17 18:51:52'),
(22,1,'Admin admin123 cập nhật cấu hình website','::ffff:192.168.0.102','2026-06-17 18:55:05'),
(23,1,'Admin admin123 cập nhật cấu hình website','::ffff:192.168.0.102','2026-06-17 18:57:03'),
(24,1,'Xóa ngân hàng: Ví Điện Tử MoMo (0999999999)','::ffff:192.168.0.102','2026-06-17 18:57:50'),
(25,1,'Xóa ngân hàng: Ngân hàng Quân Đội (MB Bank) (9999686868)','::ffff:192.168.0.102','2026-06-17 18:57:53'),
(26,1,'Admin admin123 cập nhật cấu hình website','::ffff:192.168.0.102','2026-06-17 19:13:31'),
(27,3,'Đăng nhập thành công','::ffff:192.168.0.105','2026-06-17 19:16:33'),
(28,1,'Xóa ngân hàng: Ví Điện Tử MoMo (0999999999)','::ffff:192.168.0.102','2026-06-17 19:19:26'),
(29,1,'Xóa ngân hàng: Ngân hàng Quân Đội (MB Bank) (9999686868)','::ffff:192.168.0.102','2026-06-17 19:19:29'),
(30,1,'Admin admin123 cập nhật cấu hình website','::ffff:192.168.0.102','2026-06-17 19:39:03'),
(31,1,'Admin admin123 cập nhật cấu hình website','::ffff:192.168.0.102','2026-06-17 19:39:17'),
(32,1,'Xóa ngân hàng: Ví Điện Tử MoMo (0999999999)','::ffff:192.168.0.102','2026-06-17 19:49:05'),
(33,1,'Xóa ngân hàng: Ngân hàng Quân Đội (MB Bank) (9999686868)','::ffff:192.168.0.102','2026-06-17 19:49:08'),
(34,1,'Đăng nhập thành công','::ffff:192.168.0.102','2026-06-17 20:06:17'),
(35,3,'Đăng nhập thành công','::ffff:192.168.0.102','2026-06-17 20:09:15'),
(36,1,'Đăng nhập thành công','::ffff:192.168.0.102','2026-06-17 20:09:23'),
(37,3,'Đăng nhập thành công','::ffff:192.168.0.102','2026-06-17 20:09:36'),
(38,3,'Đăng nhập thành công','::ffff:192.168.0.105','2026-06-17 20:11:01'),
(39,3,'Đăng nhập thành công','::ffff:192.168.0.102','2026-06-17 20:11:39'),
(40,3,'Đăng nhập thành công','::ffff:192.168.0.105','2026-06-17 20:12:05'),
(41,1,'Đăng nhập thành công','::ffff:192.168.0.102','2026-06-17 20:12:14'),
(42,3,'Đăng nhập thành công','::ffff:192.168.0.102','2026-06-17 23:23:16'),
(43,3,'Đăng nhập thành công','::ffff:192.168.0.102','2026-06-17 23:43:09'),
(44,3,'Đăng nhập thành công','::ffff:192.168.0.104','2026-06-17 23:44:19'),
(45,3,'Đăng nhập thành công','::ffff:192.168.0.102','2026-06-17 23:57:05'),
(46,4,'Đăng nhập thành công','::ffff:192.168.0.102','2026-06-17 23:58:07'),
(47,1,'Đăng nhập thành công','::1','2026-06-18 00:26:34'),
(48,1,'Đăng nhập thành công','::1','2026-06-18 00:26:59'),
(49,3,'Đăng nhập thành công','::1','2026-06-18 00:30:24'),
(50,1,'Đăng nhập thành công','::1','2026-06-18 00:35:04'),
(51,1,'Thêm ngân hàng mới: BIDV (999999999)','::ffff:192.168.0.102','2026-06-18 12:25:48'),
(52,3,'Đăng nhập thành công','::ffff:192.168.0.104','2026-06-18 12:32:35'),
(53,1,'Admin admin123 cập nhật cấu hình website','::ffff:192.168.0.102','2026-06-18 12:33:56'),
(54,1,'Đăng nhập thành công','::ffff:192.168.0.102','2026-06-18 12:48:29'),
(55,4,'Đăng nhập thành công','::ffff:192.168.0.102','2026-06-18 12:54:45'),
(56,1,'Đăng nhập thành công','::ffff:192.168.0.102','2026-06-18 12:58:03'),
(57,1,'Đăng nhập thành công','::ffff:192.168.0.102','2026-06-18 13:02:28'),
(58,3,'Đăng nhập thành công','::ffff:192.168.0.104','2026-06-19 10:14:09'),
(59,1,'Admin admin123 cập nhật cấu hình website','::ffff:192.168.0.102','2026-06-19 19:46:53');
/*!40000 ALTER TABLE `history_log` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `history_sepay`
--

DROP TABLE IF EXISTS `history_sepay`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `history_sepay` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `transaction_id` varchar(255) DEFAULT NULL,
  `amount` bigint(20) NOT NULL,
  `content` text DEFAULT NULL,
  `status` tinyint(4) NOT NULL DEFAULT 1 COMMENT '0=pending,1=success,2=failed,3=duplicate',
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_history_sepay_transaction_id` (`transaction_id`),
  KEY `idx_history_sepay_user_id` (`user_id`),
  KEY `idx_history_sepay_status` (`status`),
  KEY `idx_history_sepay_created_at` (`created_at`),
  CONSTRAINT `fk_history_sepay_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `history_sepay`
--

LOCK TABLES `history_sepay` WRITE;
/*!40000 ALTER TABLE `history_sepay` DISABLE KEYS */;
set autocommit=0;
/*!40000 ALTER TABLE `history_sepay` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `list_acc_game`
--

DROP TABLE IF EXISTS `list_acc_game`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `list_acc_game` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `loai_id` int(11) NOT NULL,
  `buyer_id` int(11) DEFAULT NULL,
  `seller_id` int(11) DEFAULT NULL,
  `thong_tin` longtext DEFAULT NULL COMMENT 'public account information',
  `list_thong_tin` longtext DEFAULT NULL COMMENT 'extra display information, JSON/text',
  `img` text DEFAULT NULL,
  `list_img` longtext DEFAULT NULL COMMENT 'multiple images, JSON/text',
  `login` longtext DEFAULT NULL COMMENT 'private login information: username|password',
  `gia` bigint(20) NOT NULL DEFAULT 0,
  `ck` int(11) NOT NULL DEFAULT 0 COMMENT 'collaborator discount percent for this account',
  `status` tinyint(4) NOT NULL DEFAULT 0 COMMENT '0=dang_ban,1=da_ban,2=an',
  `ngaymua` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_acc_loai_id` (`loai_id`),
  KEY `idx_acc_buyer_id` (`buyer_id`),
  KEY `idx_acc_status` (`status`),
  KEY `idx_acc_gia` (`gia`),
  CONSTRAINT `fk_acc_buyer` FOREIGN KEY (`buyer_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_acc_loai` FOREIGN KEY (`loai_id`) REFERENCES `loai_tai_khoan` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `list_acc_game`
--

LOCK TABLES `list_acc_game` WRITE;
/*!40000 ALTER TABLE `list_acc_game` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `list_acc_game` VALUES
(7,3,3,1,'Đổi được thông tin\nGiá rẻ sale sập sàn','','http://192.168.0.102:3000/uploads/1781700183576-0lw6to2gzr0d.jpg','','liên hệ zalo | để được hỗ trợ',200000,0,1,'2026-06-17 20:08:12','2026-06-17 19:43:26','2026-06-17 20:08:12'),
(35,3,3,3,'Đổi được thông tin và mật khẩu\nHỗ trợ bảo hành đến khi sập game','0','http://192.168.0.102:3000/uploads/1781701797692-n2kjequctw.jpg','0','Liên Hệ Zalo | Để nhận acc',500000,0,1,'2026-06-17 20:12:33','2026-06-17 20:10:27','2026-06-17 20:12:33'),
(36,3,4,3,'','','','','cc|cc',1000000,0,1,'2026-06-18 12:55:30','2026-06-17 23:30:18','2026-06-18 12:55:30'),
(37,3,1,3,'','','','','cc|cc',100000,0,1,'2026-06-17 23:30:47','2026-06-17 23:30:37','2026-06-17 23:30:47'),
(38,3,1,1,'Đổi được thông tin\nGiá rẻ sale sập sàn','0','http://192.168.0.102:3000/uploads/1781715561097-07s55dgyagmo.jpg','0','liên hệ zalo 0338022004 | để được hỗ trợ',200000,0,1,'2026-06-18 00:35:23','2026-06-17 23:59:23','2026-06-18 00:35:23'),
(39,3,4,1,'Đổi được thông tin\nGiá rẻ sale sập sàn','0','http://192.168.0.102:3000/uploads/1781761753586-s6fqv8d6ji.jpg','0','liên hệ zalo 0338022004 | để được hỗ trợ',500000,0,1,'2026-06-18 12:57:37','2026-06-18 12:49:16','2026-06-18 12:57:37'),
(40,3,NULL,1,'Đổi được thông tin\nGiá rẻ sale sập sàn','0','','0','liên hệ zalo 0338022004 | để được hỗ trợ',400000,0,0,NULL,'2026-06-18 12:58:23','2026-06-18 12:58:23'),
(41,3,NULL,1,'Đổi được thông tin\nGiá rẻ sale sập sàn','0','','0','liên hệ zalo 0338022004 | để được hỗ trợ',400000,0,0,NULL,'2026-06-18 12:58:23','2026-06-18 12:58:23'),
(42,3,4,1,'Đổi được thông tin\nGiá rẻ sale sập sàn','0','','0','liên hệ zalo 0338022004 | để được hỗ trợ',400000,0,1,'2026-06-18 12:58:58','2026-06-18 12:58:23','2026-06-18 12:58:58');
/*!40000 ALTER TABLE `list_acc_game` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `list_bank`
--

DROP TABLE IF EXISTS `list_bank`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `list_bank` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `account_no` varchar(50) NOT NULL,
  `account_name` varchar(255) NOT NULL,
  `bank_id` varchar(50) NOT NULL,
  `status` tinyint(4) DEFAULT 1,
  `logo` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `list_bank`
--

LOCK TABLES `list_bank` WRITE;
/*!40000 ALTER TABLE `list_bank` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `list_bank` VALUES
(7,'BIDV','999999999','TRAN VAN HIEU','BIDV',1,NULL,'2026-06-18 12:25:48','2026-06-18 12:25:48');
/*!40000 ALTER TABLE `list_bank` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `loai_tai_khoan`
--

DROP TABLE IF EXISTS `loai_tai_khoan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `loai_tai_khoan` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `danhmuc_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `img` text DEFAULT NULL,
  `noidung` longtext DEFAULT NULL,
  `camket` longtext DEFAULT NULL,
  `view` int(11) NOT NULL DEFAULT 0,
  `buy` int(11) NOT NULL DEFAULT 0,
  `status` tinyint(4) NOT NULL DEFAULT 1 COMMENT '0=hidden,1=visible',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_loai_danhmuc_id` (`danhmuc_id`),
  KEY `idx_loai_status` (`status`),
  CONSTRAINT `fk_loai_danhmuc` FOREIGN KEY (`danhmuc_id`) REFERENCES `danh_muc_tai_khoan` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `loai_tai_khoan`
--

LOCK TABLES `loai_tai_khoan` WRITE;
/*!40000 ALTER TABLE `loai_tai_khoan` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `loai_tai_khoan` VALUES
(3,3,'ACC GIÁ RẺ ( DƯỚI 1 TRIỆU )','http://192.168.0.102:3000/uploads/1781698006020-snuhxxuvepr.webp','Acc liên quân giá rẻ sale sập hè cho anh em chơi','100% đổi được mật khẩu và thông tin Bảo hành sập game',0,0,1,'2026-06-17 19:07:16','2026-06-17 19:07:16'),
(4,3,'ACC GIÁ SIÊU RẺ 20K','http://192.168.0.102:3000/uploads/1781698080958-2k0q0ulkhfr.webp','Acc giá cực rẻ có SS anh em lựa chọn','100% đổi được mật khẩu và thông tin Bảo hành sập game',0,0,1,'2026-06-17 19:08:15','2026-06-17 19:08:15'),
(5,4,'Túi mù 179k','http://192.168.0.102:3000/uploads/1781699830380-qhljsbjnbyp.webp','Túi mù 179k chắc chắn ra SSS hoặc ANIME','đổi được mật khẩu và thông tin bảo hành 100%',0,0,1,'2026-06-17 19:37:34','2026-06-17 19:37:34');
/*!40000 ALTER TABLE `loai_tai_khoan` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `ma_giam_gia`
--

DROP TABLE IF EXISTS `ma_giam_gia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `ma_giam_gia` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `magiamgia` varchar(100) NOT NULL,
  `giamgia` int(11) NOT NULL,
  `theo` enum('phantram','tienmat') NOT NULL DEFAULT 'phantram',
  `batdau` datetime DEFAULT NULL,
  `ketthuc` datetime DEFAULT NULL,
  `soluong` int(11) NOT NULL DEFAULT 0 COMMENT '0=unlimited',
  `status` tinyint(4) NOT NULL DEFAULT 1 COMMENT '0=off,1=on',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `magiamgia` (`magiamgia`),
  KEY `idx_coupon_status_time` (`status`,`batdau`,`ketthuc`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ma_giam_gia`
--

LOCK TABLES `ma_giam_gia` WRITE;
/*!40000 ALTER TABLE `ma_giam_gia` DISABLE KEYS */;
set autocommit=0;
/*!40000 ALTER TABLE `ma_giam_gia` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `acc_id` int(11) NOT NULL,
  `original_price` bigint(20) NOT NULL,
  `sale_id` int(11) DEFAULT NULL,
  `sale_price` bigint(20) DEFAULT NULL,
  `discount_id` int(11) DEFAULT NULL,
  `discount_amount` bigint(20) NOT NULL DEFAULT 0,
  `final_price` bigint(20) NOT NULL,
  `status` tinyint(4) NOT NULL DEFAULT 1 COMMENT '1=success,2=refund',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_orders_user_id` (`user_id`),
  KEY `idx_orders_acc_id` (`acc_id`),
  KEY `idx_orders_sale_id` (`sale_id`),
  KEY `idx_orders_discount_id` (`discount_id`),
  KEY `idx_orders_status` (`status`),
  KEY `idx_orders_created_at` (`created_at`),
  CONSTRAINT `fk_orders_acc` FOREIGN KEY (`acc_id`) REFERENCES `list_acc_game` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_orders_discount` FOREIGN KEY (`discount_id`) REFERENCES `ma_giam_gia` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_orders_sale` FOREIGN KEY (`sale_id`) REFERENCES `sale` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_orders_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `orders` VALUES
(7,3,7,200000,NULL,NULL,NULL,0,200000,1,'2026-06-17 20:08:12','2026-06-17 20:08:12'),
(8,3,35,500000,NULL,NULL,NULL,0,500000,1,'2026-06-17 20:12:33','2026-06-17 20:12:33'),
(10,1,37,100000,NULL,NULL,NULL,0,100000,1,'2026-06-17 23:30:47','2026-06-17 23:30:47'),
(11,1,38,200000,NULL,NULL,NULL,0,200000,1,'2026-06-18 00:35:23','2026-06-18 00:35:23'),
(12,4,36,1000000,1,100000,NULL,0,100000,1,'2026-06-18 12:55:30','2026-06-18 12:55:30'),
(13,4,39,500000,NULL,NULL,NULL,0,500000,1,'2026-06-18 12:57:37','2026-06-18 12:57:37'),
(14,4,42,400000,NULL,NULL,NULL,0,400000,1,'2026-06-18 12:58:58','2026-06-18 12:58:58');
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `sale`
--

DROP TABLE IF EXISTS `sale`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `sale` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `acc_id` int(11) NOT NULL,
  `sale_price` bigint(20) NOT NULL,
  `batdau` datetime NOT NULL,
  `ketthuc` datetime NOT NULL,
  `status` tinyint(4) NOT NULL DEFAULT 1 COMMENT '0=off,1=on',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_sale_acc_id` (`acc_id`),
  KEY `idx_sale_status_time` (`status`,`batdau`,`ketthuc`),
  CONSTRAINT `fk_sale_acc` FOREIGN KEY (`acc_id`) REFERENCES `list_acc_game` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sale`
--

LOCK TABLES `sale` WRITE;
/*!40000 ALTER TABLE `sale` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `sale` VALUES
(1,36,100000,'2026-06-18 10:00:00','2026-06-20 11:11:00',1,'2026-06-18 12:24:01','2026-06-18 12:27:26'),
(2,41,250000,'2026-06-18 17:25:00','2026-06-18 17:30:00',1,'2026-06-18 17:24:53','2026-06-18 17:24:53');
/*!40000 ALTER TABLE `sale` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `setting`
--

DROP TABLE IF EXISTS `setting`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `setting` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ten_web` varchar(255) DEFAULT NULL,
  `logo` text DEFAULT NULL,
  `favicon` text DEFAULT NULL,
  `banner` text DEFAULT NULL,
  `background` text DEFAULT NULL,
  `fb_admin` varchar(255) DEFAULT NULL,
  `sdt_admin` varchar(50) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `sepay_secret` text DEFAULT NULL,
  `ck_ctv` int(11) NOT NULL DEFAULT 0 COMMENT 'default collaborator discount percent',
  `thongbao` longtext DEFAULT NULL,
  `js_web` longtext DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `setting`
--

LOCK TABLES `setting` WRITE;
/*!40000 ALTER TABLE `setting` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `setting` VALUES
(1,'ShopGameLiQi',NULL,NULL,'http://192.168.0.102:3000/uploads/1781699932889-999fit51t9.webp',NULL,'https://www.facebook.com/tran.hieu.791097','0338022004',NULL,NULL,0,'🔥 Nạp tiền & mua acc tự động dễ dàng🔥\n🍀 Nạp atm/momo sẽ được khuyến mãi 10%🍀\n(Ví dụ: nạp 100.000đ nhận 110.000đ)\n-------------------------------\n☎️Zalo hỗ trợ : 0777 776 025',NULL,'2026-06-16 23:28:00','2026-06-19 19:46:53');
/*!40000 ALTER TABLE `setting` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `transactions`
--

DROP TABLE IF EXISTS `transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `transactions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `type` enum('deposit','buy_acc','refund','admin_add','admin_sub','ctv_earn') NOT NULL,
  `amount` bigint(20) NOT NULL COMMENT 'positive for add money, negative for subtract money',
  `balance_before` bigint(20) NOT NULL,
  `balance_after` bigint(20) NOT NULL,
  `reference_id` int(11) DEFAULT NULL COMMENT 'order_id, history_sepay_id, or manual reference',
  `description` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_transactions_user_id` (`user_id`),
  KEY `idx_transactions_type` (`type`),
  KEY `idx_transactions_reference_id` (`reference_id`),
  KEY `idx_transactions_created_at` (`created_at`),
  CONSTRAINT `fk_transactions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transactions`
--

LOCK TABLES `transactions` WRITE;
/*!40000 ALTER TABLE `transactions` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `transactions` VALUES
(1,1,'buy_acc',0,0,0,1,'Mua tài khoản #3','2026-06-17 00:55:23'),
(2,1,'admin_add',1000000,0,1000000,NULL,'Admin cộng tiền test','2026-06-17 02:06:25'),
(3,1,'buy_acc',50000,1000000,950000,2,'Mua tài khoản #1','2026-06-17 16:35:18'),
(4,1,'buy_acc',200000,950000,750000,3,'Mua tài khoản #5','2026-06-17 16:35:54'),
(5,3,'admin_add',500000,0,500000,NULL,'Admin cộng tiền','2026-06-17 18:40:36'),
(6,3,'buy_acc',150000,500000,350000,4,'Mua tài khoản #6','2026-06-17 18:40:43'),
(7,3,'buy_acc',200000,350000,150000,5,'Mua tài khoản #5','2026-06-17 18:42:09'),
(8,3,'admin_add',500000,150000,650000,NULL,'Admin cộng tiền','2026-06-17 20:06:29'),
(9,3,'buy_acc',179000,650000,471000,6,'Mua tài khoản #30','2026-06-17 20:06:44'),
(10,3,'buy_acc',200000,471000,271000,7,'Mua tài khoản #7','2026-06-17 20:08:12'),
(11,3,'admin_add',5000000,271000,5271000,NULL,'Admin cộng tiền','2026-06-17 20:12:24'),
(12,3,'buy_acc',500000,5271000,4771000,8,'Mua tài khoản #35','2026-06-17 20:12:33'),
(13,1,'buy_acc',179000,750000,571000,9,'Mua tài khoản #29','2026-06-17 23:27:27'),
(14,1,'buy_acc',100000,571000,471000,10,'Mua tài khoản #37','2026-06-17 23:30:47'),
(15,3,'ctv_earn',100000,4771000,4871000,10,'Bán tài khoản #37 (Chiết khấu shop: 0%)','2026-06-17 23:30:47'),
(16,1,'buy_acc',200000,471000,271000,11,'Mua tài khoản #38','2026-06-18 00:35:23'),
(17,4,'admin_add',1000000,0,1000000,NULL,'Admin cộng tiền','2026-06-18 12:54:37'),
(18,4,'buy_acc',100000,1000000,900000,12,'Mua tài khoản #36','2026-06-18 12:55:30'),
(19,3,'ctv_earn',100000,4871000,4971000,12,'Bán tài khoản #36 (Chiết khấu shop: 0%)','2026-06-18 12:55:30'),
(20,4,'buy_acc',500000,900000,400000,13,'Mua tài khoản #39','2026-06-18 12:57:37'),
(21,4,'buy_acc',400000,400000,0,14,'Mua tài khoản #42','2026-06-18 12:58:58');
/*!40000 ALTER TABLE `transactions` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `refresh_token_hash` varchar(255) DEFAULT NULL,
  `refresh_token_expires_at` datetime DEFAULT NULL,
  `level` tinyint(4) NOT NULL DEFAULT 0 COMMENT '0=user,1=ctv',
  `money` bigint(20) NOT NULL DEFAULT 0,
  `tong_nap` bigint(20) NOT NULL DEFAULT 0,
  `banned` tinyint(4) NOT NULL DEFAULT 0 COMMENT '0=active,1=banned',
  `ip` varchar(45) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  KEY `idx_users_level` (`level`),
  KEY `idx_users_banned` (`banned`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `users` VALUES
(1,'admin123','$2b$10$T3aGT79YLKuJTLwRHCqFaOKojiOYtNGtVf8/foZ8N58vYkM.JU3v2','74405b95c158d2cde39c720e7f5034e450d213bb72bb7c489df58f3a181aa12b','2026-07-18 13:02:28',99,271000,1000000,0,'::ffff:192.168.0.102','2026-06-16 23:42:05','2026-06-18 13:02:28'),
(2,'admin1','$2b$10$jy9lNHQfXsWNAZsqCTThOeg/W2RSWJg0rnSSNaB7pU6tH8cxmwJ6y',NULL,NULL,0,0,0,0,'::1','2026-06-16 23:49:41','2026-06-17 20:09:31'),
(3,'hieuquahay0','$2b$10$Iyz46JmmgsonNEG9k9CWZOLczBqnUFZlbaFAblgwlDRblD5MP2SDO','e4fbeccd049e40c33833a6d06fd42c61ed22f6d191949c239174eb9e46350ef2','2026-07-19 10:14:09',1,4971000,6000000,0,'::ffff:192.168.0.104','2026-06-17 17:45:45','2026-06-19 10:14:09'),
(4,'hieutran18204','$2b$10$WzN9ie7lyNawkdp5mtBeueeKozSbyQyxDQCKqqdb/yG693qKVj.zi','3eed0ec3f53b529ff462aa788fdba7dbe63210067d39c6e85a3f2133e884162c','2026-07-18 12:54:45',0,0,1000000,0,'::ffff:192.168.0.102','2026-06-17 23:58:00','2026-06-18 12:58:58');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
commit;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*M!100616 SET NOTE_VERBOSITY=@OLD_NOTE_VERBOSITY */;

-- Dump completed on 2026-06-20 12:59:58
