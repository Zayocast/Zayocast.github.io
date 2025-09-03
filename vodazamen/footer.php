<?php include 'config.php'; ?>
<footer class="mt-6 bg-gradient-to-r from-gray-200 to-gray-300 p-6 text-center text-gray-700 border-t border-gray-300 shadow-lg">
    <div class="flex flex-col md:flex-row justify-center items-center gap-4">
        <div class="flex items-center space-x-2">
            <span class="text-xl">📋</span>
            <span class="text-lg font-semibold">VODAZAMEN MANAGER</span>
        </div>
        
        <span class="text-sm">© <?php echo date('Y'); ?> Vodazamen.com – Всички права запазени</span>
        <span class="text-sm"><b>Vodazamen Manager <?php echo APP_VERSION; ?></b></span>
        <a href="mailto:zlatin.raykov@gmail.com" class="text-sm hover:text-gray-900 underline flex items-center gap-1">
            📧 Made by З.Райков
        </a>
       
    </div>
    <a href="changelog.php" class="hover:text-blue-300 transition text-center w-full sm:w-auto">🔁 ПРОМЕНИ 🔁</a>
</footer>