module ApplicationHelper

  def title(page_title)
    content_for :title, page_title.to_s
  end

  def get_errors(arr)
    mes = arr.join(", ") unless arr.empty?
  end

end
