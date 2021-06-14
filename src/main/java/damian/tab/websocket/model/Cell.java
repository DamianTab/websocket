package damian.tab.websocket.model;

import lombok.Data;

@Data
public class Cell {
    private final int x;
    private final int y;
    private boolean occupied;
    private String playerNick;
}
