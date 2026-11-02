using System.Diagnostics;

namespace NetLens.Services;

/// 统一的进程启动/控制台工具调用出口。
/// - RunConsole：调用系统命令行工具（sc/auditpol/netsh），ArgumentList 传参、捕获输出、限时等待
/// - ShellOpen：打开 URL 或可执行；带参数时走 ArgumentList（不拼接含空格风险的命令行）
public static class ProcessRunner
{
    /// 调用控制台工具并捕获输出。Ok = 退出码 0；超时/启动失败返回 (false, "")。
    public static (bool Ok, string Output) RunConsole(string fileName, int timeoutMs, params string[] args)
    {
        try
        {
            var psi = new ProcessStartInfo(fileName)
            {
                UseShellExecute = false,
                CreateNoWindow = true,
                RedirectStandardOutput = true,
            };
            foreach (var a in args) psi.ArgumentList.Add(a);
            using var p = Process.Start(psi)!;
            var output = p.StandardOutput.ReadToEnd();
            p.WaitForExit(timeoutMs);
            return (p.ExitCode == 0, output);
        }
        catch (Exception ex)
        {
            Log.Error($"{fileName} 执行失败", ex);
            return (false, "");
        }
    }

    /// 打开 URL（无参数，UseShellExecute）或启动程序（参数走 ArgumentList）。失败仅记日志。
    public static void ShellOpen(string fileName, params string[] args)
    {
        try
        {
            var psi = new ProcessStartInfo(fileName) { UseShellExecute = args.Length == 0 };
            foreach (var a in args) psi.ArgumentList.Add(a);
            Process.Start(psi);
        }
        catch (Exception ex)
        {
            Log.Error($"{fileName} 启动失败", ex);
        }
    }
}
