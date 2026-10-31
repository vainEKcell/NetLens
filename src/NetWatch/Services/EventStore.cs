using NetWatch.Models;

namespace NetWatch.Services;

/// 统一事件库：所有可观测事件（连接/DNS/大额传输/配置/提示/进程生命周期）的内存环形存储。
/// 现阶段作为证据流与持久化的数据源；调查视图由 MainViewModel 的集合筛选承担。
public sealed class EventStore
{
    private readonly object _gate = new();
    private readonly EventRecord[] _ring = new EventRecord[65536];
    private long _seq;

    public EventRecord Add(EventRecord e)
    {
        lock (_gate)
        {
            e = e with { Seq = _seq };
            _ring[_seq % _ring.Length] = e;
            _seq++;
        }
        return e;
    }
}
