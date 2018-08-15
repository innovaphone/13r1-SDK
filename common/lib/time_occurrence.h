
/*---------------------------------------------------------------------------*/
/* time_occurrence.h                                                         */
/* copyright (c) innovaphone 2018                                            */
/*                                                                           */
/*---------------------------------------------------------------------------*/

typedef enum {
    RD_NO_DAY = 0x0000,
    RD_SUNDAY = 0x0001,
    RD_MONDAY = 0x0002,
    RD_TUESDAY = 0x0004,
    RD_WEDNESDAY = 0x0008,
    RD_THURSDAY = 0x0010,
    RD_FRIDAY = 0x0020,
    RD_SATURDAY = 0x0040,
    // The recurring types can also day, week day or weekend day (like: 3rd day of month, 2nd weekday our 1st weekend day)
    RD_DAY = 0x0080,
    RD_WEEK_DAY = 0x0100,
    RD_WEEKEND_DAY = 0x0200
} recurring_days_t;

typedef enum {
    RM_JANUARY,
    RM_FEBRURARY,
    RM_MARCH,
    RM_APRIL,
    RM_MAY,
    RM_JUNE,
    RM_JULY,
    RM_AUGUST,
    RM_SEPTEMBER,
    RM_OCTOBER,
    RM_NOVEMBER,
    RM_DECEMBER
} recurring_month_t;

#define RD_ALL_DAYS     (RD_SUNDAY | RD_MONDAY | RD_TUESDAY | RD_WEDNESDAY | RD_THURSDAY | RD_FRIDAY | RD_SATURDAY)

// If used in a country with different weekdays / weekenddays defined, an app must use their own definition.
#define RD_WEEK_DAYS    (RD_MONDAY | RD_TUESDAY | RD_WEDNESDAY | RD_THURSDAY | RD_FRIDAY)
#define RD_WEEKEND_DAYS (RD_SUNDAY | RD_SATURDAY)

#define RD_NO_END_DATE  UINT64_MAX
#define RD_NO_LIMIT     UINT32_MAX

inline recurring_days_t IntToDays(int days)
{
    return recurring_days_t(days);
}

inline recurring_month_t IntToMonth(int month)
{
    return recurring_month_t(month);
}


class UTimeOccurrence {
public:
    UTimeOccurrence() {}
    virtual ~UTimeOccurrence() {}
    virtual bool TimeOccurrenceResult(class TimeOccurrence * timeOccurrence, ulong64 timeStamp) { return false; }
};

class TimeOccurrence {
private:
    int recurringType;
    ulong64 start;
    ulong64 end;
    word days;
    word dayNum;
    dword interval;
    recurring_month_t month;
    dword maxOccurrences;

    char daysSetNum[7];
    byte daysSetCount;

    word weekDays;
    word weekEndDays;

    size_t resultCount;
    ulong64 * results;
    size_t resultArraySize;

    bool ArrayPut(ulong64 value, word maxResults);
    void CalculateDailyOccurrences(ulong64 tpStart, ulong64 tpEnd, word maxResults, UTimeOccurrence * user);
    void CalculateWeeklyOccurrences(ulong64 tpStart, ulong64 tpEnd, word maxResults, UTimeOccurrence * user);
    void CalculateMonthlyOccurrences(ulong64 tpStart, ulong64 tpEnd, word maxResults, UTimeOccurrence * user);
    void CalculateOccurrences(ulong64 tpStart, ulong64 tpEnd, word maxResults, UTimeOccurrence * user);

    void Prepare();
    void PrepareDayList();
    void SetRelativeDay(time_tm_t * tm);
    void SetRelativeWeekDay(time_tm_t * tm, word days);
    void SetRelativeAnyDay(time_tm_t * tm);
    ulong64 CalculateWeeklyEnd(ulong64 startDate, dword numOfOccurrences);

public:
    TimeOccurrence();
    ~TimeOccurrence();

    void SetDailyMaster(ulong64 start, ulong64 end = RD_NO_END_DATE, dword interval = 1, dword maxOccurrences = RD_NO_LIMIT);
    void SetWeeklyMaster(dword days, ulong64 start, ulong64 end = RD_NO_END_DATE, dword interval = 1, dword maxOccurrences = RD_NO_LIMIT);
    void SetMonthlyMaster(dword dayNum, recurring_days_t day, ulong64 start, ulong64 end = RD_NO_END_DATE, dword interval = 1, dword maxOccurrences = RD_NO_LIMIT);
    void SetYearlyMaster(dword dayNum, recurring_days_t day, recurring_month_t month, ulong64 start, ulong64 end = RD_NO_END_DATE, dword interval = 1, dword maxOccurrences = RD_NO_LIMIT);

    void SetWeekDays(word weekDays);
    void SetWeekEndDays(word weekEndDays);

    bool Empty() { return this->resultCount == 0; }
    size_t Count() { return this->resultCount; }
    ulong64 Result(size_t index);
    ulong64 operator[] (size_t index) { return this->Result(index); }

    void Calculate(ulong64 timePeriodStart = 0, ulong64 timePeriodEnd = UINT64_MAX, word maxResults = UINT16_MAX);
    void Calculate(UTimeOccurrence * user, ulong64 timePeriodStart = 0, ulong64 timePeriodEnd = UINT64_MAX);
    ulong64 CalculateLastOccurrence(dword numOfOccurrences = 0);
    ulong64 CalculateFirstOccurrence();
};
