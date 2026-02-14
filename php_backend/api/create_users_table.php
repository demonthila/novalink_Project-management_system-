<?php
// cli helper to create users table if missing (for local development)
require_once __DIR__ . '/config.php';

try {
    $sql = "CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(100) NOT NULL UNIQUE,
  `password` varchar(255) NOT NULL,
  `name` varchar(100) NOT NULL,
  `role` enum('Admin','User') DEFAULT 'User',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);";
    $pdo->exec($sql);
    echo "users table ensured\n";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

?>
