
export function Game() {
  return (
    <>
      <div id="game-container">
        <div id="game-info">
          <div id="players"></div>
          <div id="game-state">Esperando partida...</div>
        </div>
        <div id="dice-area">
          <div id="rolls"></div>
          <div id="selected-rolls"></div>
        </div>
        <div id="combat-area">
          <div id="combat-log"></div>
          <div id="god-favor"></div>
        </div>
      </div>
      <script src="game/main.js" />
    </>
  );
}
