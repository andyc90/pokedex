import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import "./App.css";

const TypeBadge = ({ type }) => {
  return (
    <span className={`type-badge ${type}`} style={{ backgroundColor: `var(--${type})` }}>
      {type}
    </span>
  );
};

TypeBadge.propTypes = {
  type: PropTypes.string.isRequired,
};

const WeaknessBadge = ({ type }) => {
  return (
    <span className={`weakness-badge ${type}`} style={{ backgroundColor: `var(--${type})` }}>
      {type}
    </span>
  );
};

WeaknessBadge.propTypes = {
  type: PropTypes.string.isRequired,
};

const toTitleCase = (str) =>
  str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const formatDescription = (text) => {
  return text
    .replace(/\n|\f|\r/g, " ")
    .replace(/Pokémon/gi, "Pokémon")
    .replace(/([A-Z]+\w*)/g, (match) => {
      return match.charAt(0).toUpperCase() + match.slice(1).toLowerCase();
    });
};

const formatNumber = (number) => `#${number.toString().padStart(4, "0")}`;
const formatHeight = (height) => `${height / 10} m`;
const formatWeight = (weight) => `${weight / 10} kg`;

const App = () => {
  const [query, setQuery] = useState("");
  const [pokemon, setPokemon] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    if (pokemon) {
      fetchPokemonImage(pokemon.name);
    }
  }, [pokemon]);

  const fetchPokemonImage = async (pokemonName) => {
    try {
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName.toLowerCase()}`);
      if (!response.ok) throw new Error("Pokemon image not found.");

      const data = await response.json();
      const imageUrl = data.sprites.front_default;
      setImageUrl(imageUrl);
    } catch (error) {
      console.error("Error fetching Pokemon image:", error);
    }
  };

  const fetchPokemonData = async (pokemonName) => {
    setLoading(true);
    setError("");
    setPokemon(null);

    try {
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName.toLowerCase()}`);
      if (!response.ok) throw new Error("Pokemon not found.");

      const data = await response.json();
      const speciesResponse = await fetch(data.species.url);
      const speciesData = await speciesResponse.json();

      const descriptionEntry = speciesData.flavor_text_entries.find((entry) => entry.language.name === "en");
      const description = descriptionEntry ? formatDescription(descriptionEntry.flavor_text) : "";
      const genderRate = speciesData.gender_rate;

      let genderIcon = null;
      if (genderRate >= 0) {
        if (genderRate === 0) {
          genderIcon = (
            <span className="gender-badge male">
              <i className="fas fa-mars"></i>
            </span>
          );
        } else if (genderRate === 8) {
          genderIcon = (
            <span className="gender-badge female">
              <i className="fas fa-venus"></i>
            </span>
          );
        } else {
          genderIcon = (
            <>
              <span className="gender-badge male">
                <i className="fas fa-mars"></i>
              </span>
              <span className="gender-badge female">
                <i className="fas fa-venus"></i>
              </span>
            </>
          );
        }
      } else {
        genderIcon = (
          <span className="gender-badge genderless">
            <i className="fas fa-genderless"></i>
          </span>
        );
      }

      const categoryEntry = speciesData.genera.find((genus) => genus.language.name === "en");
      const category = categoryEntry ? categoryEntry.genus.split(" ")[0] : "";
      const abilities = data.abilities.map((ability) => toTitleCase(ability.ability.name)).join(", ");
      const types = data.types.map((typeInfo) => toTitleCase(typeInfo.type.name)).join(", ");

      const weaknesses = (
        await Promise.all(
          data.types.map(async (typeInfo) => {
            const typeResponse = await fetch(typeInfo.type.url);
            const typeData = await typeResponse.json();
            return typeData.damage_relations.double_damage_from.map((weakness) => toTitleCase(weakness.name));
          })
        )
      )
        .flat()
        .join(", ");

      setPokemon({
        number: formatNumber(data.id),
        name: toTitleCase(data.name),
        description,
        height: formatHeight(data.height),
        weight: formatWeight(data.weight),
        genderIcon,
        category,
        abilities,
        type: types,
        weaknesses,
      });
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (event) => {
    event.preventDefault();
    if (query.trim()) {
      fetchPokemonData(query);
    }
  };

  return (
    <div className="pokedex-app">
      <div className="input-container">
        <h1>
          <img src="https://archives.bulbagarden.net/media/upload/4/4b/Pok%C3%A9dex_logo.png" alt="Pokédex" />
        </h1>
        <form onSubmit={handleSearch}>
          <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="E.g. Pikachu" />
          <button type="submit">
            <i className="fa fa-search search-icon"></i>
          </button>
        </form>
      </div>
      {(pokemon || loading || error) && (
        <div className="output-container">
          {pokemon && (
            <div className="pokemon">
              <h2>{pokemon.number}</h2>
              <h3>{pokemon.name}</h3>
              {imageUrl && <img src={imageUrl} alt={pokemon.name} />}
              <p>
                <strong>Description:</strong> {pokemon.description}
              </p>
              <p>
                <strong>Height:</strong> {pokemon.height}
              </p>
              <p>
                <strong>Weight:</strong> {pokemon.weight}
              </p>
              <p>
                <strong>Gender:</strong> {pokemon.genderIcon}
              </p>
              <p>
                <strong>Category:</strong> {pokemon.category}
              </p>
              <p>
                <strong>Abilities:</strong> {pokemon.abilities}
              </p>
              <p>
                <strong>Type:</strong>{" "}
                {pokemon.type.split(", ").map((type) => (
                  <TypeBadge key={type} type={type} />
                ))}
              </p>
              <p>
                <strong>Weakness:</strong>{" "}
                {pokemon.weaknesses.split(", ").map((type) => (
                  <WeaknessBadge key={type} type={type} />
                ))}
              </p>
            </div>
          )}
          {loading && <p className="loading">Loading...</p>}
          {error && <p className="error">Error: {error}</p>}
        </div>
      )}
    </div>
  );
};

export default App;
