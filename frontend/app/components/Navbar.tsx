import Image from "next/image";
import Link from "next/link";
import logo from "@/media/SimliLogoV2.svg";
import gitHubLogo from "@/media/github-mark-white.svg";

const links = [
  { label: "Documentation", href: "https://docs.simli.com" },
  { label: "Pipecat", href: "https://docs.pipecat.ai" },
  { label: "Discord", href: "https://discord.gg/yQx49zNF4d" },
];

// The Simli logo, the GitHub link and the links, pinned to the corners of the page.
export default function Navbar() {
  return (
    <>
      <Link href="/" className="fixed top-[32px] left-[32px]">
        <Image src={logo} alt="Simli logo" />
      </Link>

      <a
        href="https://github.com/simliai/create-simli-app-pipecat"
        target="_blank"
        className="absolute top-[32px] right-[32px] text-xl leading-8 font-bold"
      >
        <Image className="mr-2 inline w-[20px]" src={gitHubLogo} alt="" />
        create-simli-app (Pipecat)
      </a>

      <nav className="fixed bottom-[32px] left-[32px] z-50">
        <ul className="flex space-x-8 bg-black font-medium">
          {links.map((link) => (
            <li key={link.label}>
              <a href={link.href} target="_blank" className="block text-white hover:underline">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
