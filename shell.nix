with import <nixpkgs> {};
with pkgs;
let
  # generate these files with:
  #   nix-env -i node2nix
  #   echo '[ "jest" ]' > jest.json
  #   node2nix -i jest.json
  # nodeEnv = callPackage ./jest/node-env.nix {};
  # nodePackages = callPackage ./jest/node-packages.nix { inherit nodeEnv; };
in mkShell {
  buildInputs = [ nodejs nodePackages.node2nix ];
}
