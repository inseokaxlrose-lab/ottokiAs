export default function Footer() {
  return (
    <footer className='bg-white border-t border-slate-200 mt-auto'>
      <div className='max-w-5xl mx-auto px-4 sm:px-6 py-8'>
        <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
          <div>
            <span className='text-lg font-bold text-blue-600'>OTTOKI</span>
            <p className='text-sm text-slate-500 mt-1'>
              고객 서비스 센터 | 평일 09:00 ~ 18:00
            </p>
          </div>
          <div className='text-sm text-slate-400'>
            © {new Date().getFullYear()} OTTOKI. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  )
}
