namespace AiPrReviewer.Services;

public class RateLimiter
{
    private readonly int _maxRequestsPerMinute;
    private readonly Queue<DateTime> _requestTimes = new();
    private readonly SemaphoreSlim _semaphore = new(1, 1);

    public RateLimiter(int maxRequestsPerMinute = 10)
    {
        _maxRequestsPerMinute = maxRequestsPerMinute;
    }

    public async Task WaitAsync()
    {
        await _semaphore.WaitAsync();
        try
        {
            var now = DateTime.UtcNow;
            var windowStart = now.AddMinutes(-1);

            // Remove expired entries
            while (_requestTimes.Count > 0 && _requestTimes.Peek() < windowStart)
                _requestTimes.Dequeue();

            // Wait if at limit
            if (_requestTimes.Count >= _maxRequestsPerMinute)
            {
                var oldest = _requestTimes.Peek();
                var waitTime = oldest.AddMinutes(1) - now;
                if (waitTime > TimeSpan.Zero)
                {
                    Console.WriteLine($"Rate limit reached. Waiting {waitTime.TotalSeconds:F1}s...");
                    await Task.Delay(waitTime);
                }
            }

            _requestTimes.Enqueue(DateTime.UtcNow);
        }
        finally
        {
            _semaphore.Release();
        }
    }
}
