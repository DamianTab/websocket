package damian.tab.websocket.websocket;

import damian.tab.websocket.model.Cell;
import damian.tab.websocket.model.Game;
import damian.tab.websocket.model.Player;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.BinaryMessage;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.BinaryWebSocketHandler;

import java.awt.geom.Point2D;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import static damian.tab.websocket.Utils.CELL_RADIUS;
import static damian.tab.websocket.Utils.PLAYER_RADIUS;

@Slf4j
@Service
public class BinaryWebSocket extends BinaryWebSocketHandler {

    private Map<String, Game> games = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws IOException {
        Map<String, String> params = extractClientCredentials(session.getUri().getQuery());
        String roomName = params.get("room");
        String playerNick = params.get("player");

        Game game = games.get(roomName);
        Player player = new Player(playerNick, session);
        if (game == null) {
            game = new Game(player);
            games.put(roomName, game);
            log.info("New game in room: {}", roomName);
        } else {
            if (game.getSuspendedPlayers().containsKey(playerNick)) {
                player = game.getSuspendedPlayers().remove(playerNick);
                player = new Player(player.getX(), player.getY(), player.getScore(), playerNick, session);
            }
            game.getPlayers().put(playerNick, player);
        }
        log.info("+++ New player: {}        in game: {}", playerNick, roomName);
//        Init Cells position for current session
        sendAllCellsToPlayer(session, game.getCells());
//        Init rest players position for current session
        sendAllPlayersMovesToPlayer(session, game.getPlayers());
//        Inform all other sessions about new player
        broadcastPlayerMoveMessage(game, player);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        Map<String, String> params = extractClientCredentials(session.getUri().getQuery());
        String roomName = params.get("room");
        String playerNick = params.get("player");

        Game game = games.get(roomName);
        log.info("--- Delete player: {}        from game: {}", playerNick, roomName);
        Player deletedPlayer = game.getPlayers().remove(playerNick);
        game.getSuspendedPlayers().put(playerNick, deletedPlayer);
//        Inform other players about leave the match
        broadcastPlayerMoveMessage(game, new Player((short) -1, (short) -1, (short) -1, playerNick, null));
        if (game.getPlayers().size() == 0) {
            games.remove(roomName);
        }

    }

    @Override
    protected void handleBinaryMessage(WebSocketSession session, BinaryMessage message) {
        Map<String, String> params = extractClientCredentials(session.getUri().getQuery());
        String roomName = params.get("room");
        String playerNick = params.get("player");

        Player messagePlayer = extractPlayerFromMessage(message);
        Game game = games.get(roomName);
//        Totally-threadsafe
        Player player = game.getPlayers().computeIfPresent(playerNick, (key, value) -> {
            value.setX(messagePlayer.getX());
            value.setY(messagePlayer.getY());
            return value;
        });

        game.getCells().stream()
                .filter(cell -> Point2D.distance(cell.getX(), cell.getY(), player.getX(), player.getY()) <= PLAYER_RADIUS - CELL_RADIUS)
                .forEach(cell -> {
                    synchronized (cell) {
                        if (cell.getOccupied() == 0) {
                            cell.setOccupied((short) 1);
                            cell.setPlayerNick(playerNick);
                            player.setScore((short) (player.getScore() + 1));
                            broadcastCellInfoMessage(game, cell);
                        }
                    }
                });
        broadcastPlayerMoveMessage(game, player);
    }

    private void sendAllPlayersMovesToPlayer(WebSocketSession session, Map<String, Player> players) {
        players.forEach((key, player) -> {
            sendPlayerMoveMessage(session, player);
        });
    }

    private void broadcastPlayerMoveMessage(Game game, Player sendingPlayer) {
        game.getPlayers().forEach((k, player) -> {
            sendPlayerMoveMessage(player.getSession(), sendingPlayer);
        });
    }

    private void sendPlayerMoveMessage(WebSocketSession session, Player sendingPlayer) {
        try {
            byte[] nickBytes = sendingPlayer.getNick().getBytes();
            byte[] arr = ByteBuffer.allocate(8 + nickBytes.length)
                    .put(shortToBytes((short) 1))
                    .put(shortToBytes(sendingPlayer.getX()))
                    .put(shortToBytes(sendingPlayer.getY()))
                    .put(shortToBytes(sendingPlayer.getScore()))
                    .put(nickBytes)
                    .array();
            BinaryMessage message = new BinaryMessage(arr);
            synchronized (session) {
                session.sendMessage(message);
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private void sendAllCellsToPlayer(WebSocketSession session, List<Cell> cells) {
        cells.forEach(cell -> sendCellInfoMessage(session, cell));
    }

    private void broadcastCellInfoMessage(Game game, Cell cell) {
        game.getPlayers().forEach((key, player) -> {
            sendCellInfoMessage(player.getSession(), cell);
        });
    }

    private void sendCellInfoMessage(WebSocketSession session, Cell cell) {
        try {
            byte[] arr = ByteBuffer.allocate(8)
                    .put(shortToBytes((short) 2))
                    .put(shortToBytes(cell.getX()))
                    .put(shortToBytes(cell.getY()))
                    .put(shortToBytes(cell.getOccupied()))
                    .array();
            BinaryMessage message = new BinaryMessage(arr);
            synchronized (session) {
                session.sendMessage(message);
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private byte[] shortToBytes(short number) {
        return ByteBuffer
                .allocate(2)
                .putShort(number)
                .array();
    }

    private Player extractPlayerFromMessage(BinaryMessage message) {
        ByteBuffer payload = message.getPayload().order(ByteOrder.LITTLE_ENDIAN);
        short messageType = payload.getShort(0);
        short x = payload.getShort(2);
        short y = payload.getShort(4);
        short score = payload.getShort(6);
        payload.position(8);
        payload = payload.slice();
        String nick = StandardCharsets.UTF_8.decode(payload).toString();
        log.debug("Message from: '{}'. Type: {}, X: {}, Y: {}, Score (Client state): {}", nick, messageType, x, y, score);
        return new Player(x, y, score, nick, null);
    }

    private Map<String, String> extractClientCredentials(String queryParams) {
        Map<String, String> result = new HashMap<>();
        String[] params = queryParams.split("&");
        for (int i = 0; i < 2; i++) {
            String[] keyValue = params[i].split("=");
            result.put(keyValue[0].trim(), keyValue[1].trim());
        }
        return result;
    }

}
