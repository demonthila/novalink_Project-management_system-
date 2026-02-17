<?php
// deploy.php - Auto-pull from GitHub via Cron Job

// SECURITY: Protect this script with a secret token
$secret = 'stratis_secure_cron_token_123'; // Must match your secrets.php CRON_SECRET or be unique

// Check for secret token in URL (e.g. deploy.php?token=stratis...)
if (!isset($_GET['token']) || $_GET['token'] !== $secret) {
    http_response_code(403);
    die('Access Denied: Invalid Token');
}

// Configuration
$repo_dir = '/home/u350252325/domains/novalinkinnovations.com/public_html'; // Adjust path if needed
$git_repo = 'https://github.com/demonthila/novalink_Project-management_system-.git';
$branch = 'main';

echo "🚀 Starting Deployment...\n";
echo "-------------------------\n";

// Change to repository directory
if (!chdir($repo_dir)) {
    die("❌ Error: Could not change directory to $repo_dir");
}

// Run Git commands
$commands = [
    'echo $PWD',
    'whoami',
    'git fetch origin ' . $branch,
    'git reset --hard origin/' . $branch, // Force overwrite local changes with remote
    // 'npm run build' - usually can't run npm on shared hosting comfortably, rely on pushed 'dist'
];

foreach ($commands as $cmd) {
    echo "Running: $cmd\n";
    $output = [];
    $return_var = 0;
    exec($cmd . ' 2>&1', $output, $return_var);
    
    foreach ($output as $line) {
        echo "  > $line\n";
    }
    
    if ($return_var !== 0) {
        echo "❌ Command failed with exit code $return_var\n";
    } else {
        echo "✅ OK\n";
    }
    echo "\n";
}

echo "-------------------------\n";
echo "🎉 Deployment logic finished.\n";
echo "Current time: " . date('Y-m-d H:i:s') . "\n";
?>
