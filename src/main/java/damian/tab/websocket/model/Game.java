package damian.tab.websocket.model;

import lombok.Data;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Data
public class Game {
    private Map<String, Player> players = new HashMap<>();
    private Map<String, Player> suspendedPlayers = new HashMap<>();
    private List<Cell> cells = new ArrayList<>();
    private boolean status;
}
