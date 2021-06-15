package damian.tab.websocket;

import java.util.Random;

public class Utils {
    private static final int MIN_VALUE = 30;
    private static final int MAX_VALUE = 870;
    private static final Random RANDOM = new Random();

    public static short getRandomBetween(){
        return (short) RANDOM.ints(MIN_VALUE, MAX_VALUE)
                .findFirst()
                .getAsInt();
    }
}
