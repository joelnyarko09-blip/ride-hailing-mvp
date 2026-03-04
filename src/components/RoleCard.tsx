type RoleCardProps = {
  title: string;
  description: string;
  onClick: () => void;
};

export default function RoleCard({ title, description, onClick }: RoleCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-[#1E293B] p-6 rounded-2xl cursor-pointer hover:scale-105 transition-all duration-200 shadow-lg border border-transparent hover:border-[#229ED9]"
    >
      <h2 className="text-white text-xl font-semibold">{title}</h2>
      <p className="text-gray-400 mt-2">{description}</p>
    </div>
  )
}
