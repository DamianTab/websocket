package damian.tab.websocket.model;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Data
public class Game {
    private static final int GAME_CELLS = 30;
    private static final int MIN_VALUE = 25;
    private static final int MAX_VALUE = 875;
    private static final Random RANDOM = new Random();

    private Map<String, Player> players = new ConcurrentHashMap<>();
    private Map<String, Player> suspendedPlayers = new ConcurrentHashMap<>();
    private List<Cell> cells = new CopyOnWriteArrayList<>();
    private boolean status = false;

    public Game(Player player) {
        this.players.put(player.getNick(), player);
        generateGameCells();
    }

    private void generateGameCells(){
        for (int i = 0; i < GAME_CELLS; i++) {
            Cell cell = new Cell(getRandomBetween(), getRandomBetween());
            cells.add(cell);
        }
    }
    private short getRandomBetween(){
        return (short) RANDOM.ints(MIN_VALUE, MAX_VALUE)
                .findFirst()
                .getAsInt();
    }
}
